const Schedule = require("./model");
const ShopOrder = require('../OrderManagement/ShopOrder');
const Machine = require('../InventoryManagement/Machine');
const User = require('../UserManagement/User');
const scheduleService = require('../../services/scheduleService');
const ApiError = require('../../utils/apiError');

// Get full schedule
exports.getSchedule = async (req, res, next) => {
    try {
        const { status, machineId, operatorId } = req.query;
        const filter = {};

        if (status) filter.status = status;
        if (machineId) filter.machineId = machineId;
        if (operatorId) filter.operatorId = operatorId;

        const schedule = await Schedule.find(filter)
            .populate('orderId', 'orderNumber jobType')
            .populate('machineId', 'name type')
            .populate('operatorId', 'name')
            .sort({ scheduledStart: 1 });

        res.status(200).json({
            success: true,
            count: schedule.length,
            data: schedule,
        });
    } catch (error) {
        next(error);
    }
};

// Create schedule entry
exports.createSchedule = async (req, res, next) => {
    try {
        const scheduleEntry = await scheduleService.createScheduleEntry(req.body);
        res.status(201).json({
            success: true,
            data: scheduleEntry,
        });
    } catch (error) {
        next(error);
    }
};

// Update schedule entry
exports.updateSchedule = async (req, res, next) => {
    try {
        const schedule = await Schedule.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        if (!schedule) {
            return next(new ApiError('Schedule entry not found', 404));
        }

        res.status(200).json({
            success: true,
            data: schedule,
        });
    } catch (error) {
        next(error);
    }
};

// Update individual job status
exports.updateJobStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const schedule = await Schedule.findById(req.params.id);

        if (!schedule) {
            return next(new ApiError('Schedule entry not found', 404));
        }

        schedule.status = status;
        await schedule.save();

        // If completed, update order and machine status
        if (status === 'completed') {
            await ShopOrder.findByIdAndUpdate(schedule.orderId, { status: 'completed' });
            await Machine.findByIdAndUpdate(schedule.machineId, { status: 'available' });
        } else if (status === 'in_progress') {
            await ShopOrder.findByIdAndUpdate(schedule.orderId, { status: 'in_progress' });
            await Machine.findByIdAndUpdate(schedule.machineId, { status: 'busy' });
        }

        res.status(200).json({
            success: true,
            data: schedule,
        });
    } catch (error) {
        next(error);
    }
};
