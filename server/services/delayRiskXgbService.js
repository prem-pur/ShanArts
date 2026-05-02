const ShopOrder = require('../modules/OrderManagement/ShopOrder');
const Machine = require('../modules/InventoryManagement/Machine');
const User = require('../modules/UserManagement/User');
const mlService = require('../src/services/mlService');
const notificationService = require('./notificationService');
const { generateRiskAlertCustomerMessage } = require('./riskAlertMessageService');

function toIsoDate(d) {
    try {
        const dt = new Date(d);
        if (Number.isNaN(dt.getTime())) return null;
        return dt.toISOString().slice(0, 10);
    } catch {
        return null;
    }
}

function mapJobType(jobType) {
    const jt = String(jobType || '').toLowerCase();
    if (jt === 'flyer' || jt === 'flyers') return 'Flyers';
    if (jt === 'banner' || jt === 'banners') return 'Banners';
    if (jt === 'sticker' || jt === 'stickers') return 'Stickers';
    if (jt === 'brochure' || jt === 'brochures') return 'Brochures';
    if (jt === 'business_card' || jt === 'business cards' || jt === 'business_card') return 'Business Cards';
    if (jt === 'poster' || jt === 'posters') return 'Posters';
    return 'Flyers';
}

function clamp01(x) {
    if (!Number.isFinite(x)) return 0;
    return Math.max(0, Math.min(1, x));
}

function workloadPctFromCount(count) {
    const c = Number(count) || 0;
    // Simple heuristic: 0→0, 1→35, 2→70, 3+→100
    return Math.max(0, Math.min(100, c * 35));
}

async function buildPayload(order) {
    const [queuedJobs, activeMachines, totalMachines, totalStaff] = await Promise.all([
        ShopOrder.countDocuments({ status: { $in: ['scheduled', 'confirmed', 'in_progress', 'printing'] } }),
        Machine.countDocuments({ status: { $in: ['Available', 'In Use', 'Scheduled'] } }),
        Machine.countDocuments({}),
        User.countDocuments({ role: 'staff_operator', isActive: true }),
    ]);

    const machineJobCount = order.assignedMachineId
        ? await ShopOrder.countDocuments({
            assignedMachineId: order.assignedMachineId,
            status: { $in: ['confirmed', 'in_progress', 'printing'] },
        })
        : 0;
    const operatorJobCount = order.assignedOperatorId
        ? await ShopOrder.countDocuments({
            assignedOperatorId: order.assignedOperatorId,
            status: { $in: ['confirmed', 'in_progress', 'printing'] },
        })
        : 0;

    const Order_Request_Date = toIsoDate(order.createdAt || new Date()) || toIsoDate(new Date());
    const Requested_Deadline_Date = toIsoDate(order.deadline || order.scheduledEnd || new Date());
    const Assigned_Date = toIsoDate(order.scheduledStart || new Date());
    const Estimated_End_Date = toIsoDate(order.scheduledEnd || new Date(Date.now() + 24 * 3600 * 1000));

    return {
        Job_Type: mapJobType(order.jobType),
        Quantity: Number(order.quantity || 1),
        Color_Type: 'Full Color',
        Material_Type: 'Matte Paper',
        Order_Request_Date,
        Requested_Deadline_Date,
        Assigned_Date,
        Estimated_End_Date,
        Current_Queued_Jobs_Count: Number(queuedJobs || 0),
        Active_Machines_Count: Number(activeMachines || 0),
        Total_Machines_Count: Math.max(1, Number(totalMachines || 1)),
        Available_Staff_Count: Number(totalStaff || 0),
        Total_Staff_Count: Math.max(1, Number(totalStaff || 1)),
        Priority: (String(order.priority || 'normal').toLowerCase() === 'urgent') ? 'Urgent' : 'Normal',
        Assigned_Machine_Workload: workloadPctFromCount(machineJobCount),
        Assigned_Operator_Workload: workloadPctFromCount(operatorJobCount),
    };
}

/**
 * Predict delay risk for a ShopOrder (using DB context) and store on the order.
 * This is called after assign/reschedule so scheduledStart/scheduledEnd/machine/operator exist.
 */
async function predictAndStoreForOrder(orderId) {
    const order = await ShopOrder.findById(orderId).populate('customerId', 'name');
    if (!order) return null;

    // Only predict when schedule exists (the model expects these dates)
    if (!order.scheduledStart || !order.scheduledEnd) return null;

    const ok = await mlService.checkModelHealth();
    if (!ok) {
        const err = new Error('ML server unavailable');
        err.status = 503;
        throw err;
    }

    const payload = await buildPayload(order);
    const res = await mlService.predict(payload);

    const label = String(res?.delay_risk_label || '').trim();
    const confidence = clamp01(Number(res?.confidence));
    const probabilities = res?.probabilities && typeof res.probabilities === 'object' ? res.probabilities : {};

    order.delayRiskLevel = ['High', 'Medium', 'Low'].includes(label) ? label : undefined;
    order.delayRiskConfidence = Number.isFinite(confidence) ? confidence : undefined;
    order.delayRiskProbabilities = {
        High: Number(probabilities.High ?? 0),
        Medium: Number(probabilities.Medium ?? 0),
        Low: Number(probabilities.Low ?? 0),
    };
    order.delayRiskPredictedAt = new Date();

    // Notify admins once when risk becomes High
    if (order.delayRiskLevel === 'High' && !order.delayRiskHighNotifiedAt) {
        try {
            await notificationService.notifyAdmins(
                'delay_risk_high',
                `High delay risk: ${order.orderNumber}`,
                `Order #${order.orderNumber} has HIGH delay risk. Please review schedule and update the customer if needed.`,
                order._id,
                'ShopOrder',
                { delayRiskLevel: order.delayRiskLevel, confidence: order.delayRiskConfidence }
            );
            order.delayRiskHighNotifiedAt = new Date();
        } catch (e) {
            // eslint-disable-next-line no-console
            console.warn('[delayRiskXgbService] notifyAdmins failed:', e?.message || e);
        }
    }

    // Notify customer on Medium risk (once per new prediction)
    if (order.delayRiskLevel === 'Medium') {
        const sent = order.lastDelayRiskCustomerMessageAt ? new Date(order.lastDelayRiskCustomerMessageAt).getTime() : 0;
        const predAt = order.delayRiskPredictedAt ? new Date(order.delayRiskPredictedAt).getTime() : 0;
        if (!sent || predAt > sent) {
            try {
                const ctx = {
                    companyName: 'Shan Art Advertising',
                    customerName: order.customerId?.name || 'Valued Customer',
                    orderNumber: order.orderNumber || String(order._id),
                    jobType: order.jobType,
                    quantity: order.quantity,
                    deadline: order.deadline,
                    riskLevel: 'Medium',
                    confidence: order.delayRiskConfidence,
                };
                const { message } = await generateRiskAlertCustomerMessage(ctx);
                order.lastDelayRiskCustomerMessage = message;
                order.lastDelayRiskCustomerMessageAt = new Date();
                order.customerDelayRiskPopupAckAt = null;
                if (order.customerId) {
                    await notificationService.notifyUser(
                        order.customerId._id || order.customerId,
                        'delay_risk_medium',
                        'Schedule update',
                        message,
                        order._id,
                        'ShopOrder'
                    );
                }
            } catch (e) {
                // eslint-disable-next-line no-console
                console.warn('[delayRiskXgbService] customer Medium notify failed:', e?.message || e);
            }
        }
    }

    await order.save();

    return order;
}

module.exports = { predictAndStoreForOrder };

