const ShopOrder = require('../modules/OrderManagement/ShopOrder');
const Machine = require('../modules/InventoryManagement/Machine');
const User = require('../modules/UserManagement/User');
const mlService = require('./mlService');

function toTitleWords(s) {
    return String(s || '')
        .replace(/_/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\b\w/g, (m) => m.toUpperCase());
}

function mapJobType(jobType) {
    const jt = String(jobType || '').toLowerCase().trim();
    const map = {
        business_card: 'Business Cards',
        flyer: 'Flyers',
        brochure: 'Brochures',
        poster: 'Posters',
        banner: 'Banners',
        sticker: 'Stickers',
        invitation: 'Invitations',
        social_media: 'Social Media',
        other: 'Other',
    };
    if (map[jt]) return map[jt];
    return jt ? toTitleWords(jt) : 'Other';
}

function mapPriority(p) {
    const s = String(p || 'normal').toLowerCase().trim();
    return s === 'urgent' ? 'Urgent' : 'Normal';
}

function clamp01(x) {
    const n = Number(x);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(1, n));
}

function estimateWorkloadPct(overlapCount) {
    // DB-driven heuristic: each overlapping job ~25% load, capped.
    const c = Number(overlapCount) || 0;
    return Math.max(0, Math.min(100, c * 25));
}

/**
 * Build the ML payload strictly from DB state + schedule time.
 * Returns null when required fields aren't available yet.
 */
async function buildPayloadFromDb(order) {
    if (!order) return null;

    // Required for meaningful prediction
    const orderReq = order.createdAt || new Date();
    const assignedDate = order.scheduledStart || new Date();
    const estimatedEnd = order.scheduledEnd || null;
    const deadline = order.deadline || null;
    if (!estimatedEnd) return null;

    const [totalMachines, activeMachines, totalStaff] = await Promise.all([
        Machine.countDocuments({}),
        Machine.countDocuments({ status: { $nin: ['Under Maintenance', 'Out of Order'] } }),
        User.countDocuments({ role: 'staff_operator', isActive: true }),
    ]);

    const timeFilter = {
        status: { $in: ['confirmed', 'in_progress', 'printing'] },
        _id: { $ne: order._id },
        scheduledStart: { $lt: new Date(estimatedEnd) },
        scheduledEnd: { $gt: new Date(assignedDate) },
    };

    const [queueCount, machineOverlaps, operatorOverlaps] = await Promise.all([
        ShopOrder.countDocuments({
            status: { $in: ['scheduled', 'confirmed', 'in_progress', 'printing'] },
        }),
        order.assignedMachineId
            ? ShopOrder.countDocuments({ ...timeFilter, assignedMachineId: order.assignedMachineId })
            : 0,
        order.assignedOperatorId
            ? ShopOrder.countDocuments({ ...timeFilter, assignedOperatorId: order.assignedOperatorId })
            : 0,
    ]);

    const busyOperatorCount = await ShopOrder.distinct('assignedOperatorId', {
        ...timeFilter,
        assignedOperatorId: { $ne: null },
    }).then((ids) => (Array.isArray(ids) ? ids.length : 0));

    const availableStaff = Math.max(0, (Number(totalStaff) || 0) - busyOperatorCount);

    const payload = {
        Job_Type: mapJobType(order.jobType),
        Color_Type: 'Full Color', // not stored in DB currently
        Material_Type: 'Standard', // not stored in DB currently
        Order_Request_Date: new Date(orderReq).toISOString().slice(0, 10),
        Requested_Deadline_Date: (deadline ? new Date(deadline) : new Date(estimatedEnd)).toISOString().slice(0, 10),
        Assigned_Date: new Date(assignedDate).toISOString().slice(0, 10),
        Estimated_End_Date: new Date(estimatedEnd).toISOString().slice(0, 10),
        Quantity: Number(order.quantity || 0),
        Current_Queued_Jobs_Count: Number(queueCount || 0),
        Active_Machines_Count: Number(activeMachines || 1),
        Total_Machines_Count: Number(totalMachines || 1),
        Available_Staff_Count: Number(availableStaff || 1),
        Total_Staff_Count: Number(totalStaff || 1),
        Priority: mapPriority(order.priority),
        Assigned_Machine_Workload: estimateWorkloadPct(machineOverlaps),
        Assigned_Operator_Workload: estimateWorkloadPct(operatorOverlaps),
    };

    return payload;
}

async function predictAndStoreForOrder(orderId) {
    const order = await ShopOrder.findById(orderId);
    if (!order) return null;

    const payload = await buildPayloadFromDb(order);
    if (!payload) return null;

    const ok = await mlService.checkModelHealth();
    if (!ok) return null;

    const pred = await mlService.predict(payload);
    // Store the XGBoost outputs
    order.delayRiskLevel = pred.delay_risk_label;
    order.delayRiskConfidence = pred.confidence;
    order.delayRiskProbabilities = {
        High: clamp01(pred.probabilities?.High),
        Medium: clamp01(pred.probabilities?.Medium),
        Low: clamp01(pred.probabilities?.Low),
    };
    order.delayRiskPredictedAt = new Date();

    await order.save();
    return { order, payload, prediction: pred };
}

module.exports = { buildPayloadFromDb, predictAndStoreForOrder };

