const Schedule = require('../modules/ScheduleManagement/model');
const ShopOrder = require('../modules/OrderManagement/ShopOrder');
const Machine = require('../modules/InventoryManagement/Machine');
const User = require('../modules/UserManagement/User');
const aiService = require('./aiService');
const notificationService = require('./notificationService');

const scheduleService = {
    async createScheduleEntry(data) {
        const { orderId, machineId, operatorId, scheduledStart, scheduledEnd, priority } = data;

        const order = await ShopOrder.findById(orderId);
        if (!order) throw new Error('Order not found');

        const machine = await Machine.findById(machineId);
        if (!machine) throw new Error('Machine not found');

        const operator = await User.findById(operatorId);
        if (!operator || operator.role !== 'staff_operator') {
            throw new Error('Invalid operator');
        }

        const scheduleEntry = new Schedule({
            orderId,
            machineId,
            operatorId,
            scheduledStart: scheduledStart || new Date(),
            scheduledEnd: scheduledEnd || new Date(Date.now() + (order.estimatedCompletionTime || 60) * 60000),
            priority: priority || 0,
            status: 'queued',
        });

        await scheduleEntry.save();

        // Update order
        order.assignedMachineId = machineId;
        order.assignedOperatorId = operatorId;

        // AI Delay Prediction
        try {
            const delayPrediction = await aiService.predictDelay({
                estimated_duration_min: order.estimatedCompletionTime || 60,
                workload_ratio: 0.5,
                operator_experience_score: 0.8,
                priority: priority || 0,
                hours_to_deadline: Math.round((order.deadline - new Date()) / 3600000),
                job_type: order.jobType,
            });

            order.delayRiskScore = delayPrediction.risk_score;
            order.delayRiskLabel = delayPrediction.risk_label;

            if (['at_risk', 'delayed'].includes(delayPrediction.risk_label)) {
                await notificationService.notifyAdmins(
                    'delay_risk',
                    'Order At Risk of Delay',
                    `Order #${order.orderNumber} is at ${delayPrediction.risk_label} of missing deadline.`,
                    order._id,
                    'Order'
                );
            }
        } catch (aiError) {
            console.error('AI Service Error:', aiError.message);
        }

        await order.save();

        // Notify operator
        await notificationService.createNotification(
            operatorId,
            'job_assigned',
            'New Job Assigned',
            `You have been assigned job #${order.orderNumber}.`,
            order._id,
            'Order'
        );

        return scheduleEntry;
    },

    async getAIRecommendation(orderId) {
        const order = await ShopOrder.findById(orderId);
        if (!order) throw new Error('Order not found');

        const machines = await Machine.find({ status: 'available' });
        const operators = await User.find({ role: 'staff_operator', isActive: true });

        if (machines.length === 0 || operators.length === 0) {
            return null;
        }

        // Basic recommendation logic (can be enhanced with AI)
        return {
            suggestedMachineId: machines[0]._id,
            suggestedOperatorId: operators[0]._id,
            estimatedCompletionTime: order.estimatedCompletionTime || 60,
        };
    },

};

module.exports = scheduleService;
