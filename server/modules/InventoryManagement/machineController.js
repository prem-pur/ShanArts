const Machine = require("./Machine");
const ShopOrder = require('../OrderManagement/ShopOrder');
const ApiError = require('../../utils/apiError');
const notificationService = require('../../services/notificationService');

// Get all machines
exports.getAllMachines = async (req, res, next) => {
    try {
        const { limit = 50, status } = req.query;
        let filter = {};
        
        // Filter by status if provided
        if (status) {
            filter.status = status;
        }
        
        const machines = await Machine.find(filter)
            .populate('operatorId', 'name email phone')
            .populate('currentOrderId', 'orderId status')
            .limit(parseInt(limit, 10));
            
        res.status(200).json({
            success: true,
            count: machines.length,
            data: machines,
        });
    } catch (error) {
        next(error);
    }
};

// Add new machine
exports.addMachine = async (req, res, next) => {
    try {
        const { name, type, location, specifications, notes } = req.body;

        if (!name || !type) {
            return next(new ApiError('Machine name and type are required', 400));
        }

        const machine = new Machine({
            name,
            type,
            location: location || 'Main Production Floor',
            specifications: specifications || '',
            notes: notes || '',
            status: 'Available',
            lastMaintenanceDate: new Date(), // Set initial maintenance date
            nextMaintenanceDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        });

        await machine.save();

        res.status(201).json({
            success: true,
            message: 'Machine added successfully',
            data: machine,
        });
    } catch (error) {
        next(error);
    }
};

// Get machine by ID
exports.getMachineById = async (req, res, next) => {
    try {
        const machine = await Machine.findById(req.params.id)
            .populate('operatorId', 'name email phone')
            .populate('currentOrderId', 'orderId status printSpecs')
            .populate('currentJobId', 'orderId status printSpecs');

        if (!machine) {
            return next(new ApiError('Machine not found', 404));
        }

        res.status(200).json({
            success: true,
            data: machine,
        });
    } catch (error) {
        next(error);
    }
};

// Update machine info
exports.updateMachine = async (req, res, next) => {
    try {
        const { name, type } = req.body;
        const machine = await Machine.findByIdAndUpdate(
            req.params.id,
            { name, type },
            { new: true, runValidators: true }
        );

        if (!machine) {
            return next(new ApiError('Machine not found', 404));
        }

        res.status(200).json({
            success: true,
            message: 'Machine updated successfully',
            data: machine,
        });
    } catch (error) {
        next(error);
    }
};

// Update machine status
exports.updateMachineStatus = async (req, res, next) => {
    try {
        const { status, currentOrderId, startTime, estimatedEndTime, notes } = req.body;
        const validStatuses = ["Available", "In Use", "Scheduled", "Under Maintenance", "Out of Order"];

        if (!status || !validStatuses.includes(status)) {
            return next(
                new ApiError(
                    `Invalid status. Allowed: ${validStatuses.join(', ')}`,
                    400
                )
            );
        }

        const updateData = { status };
        
        // Add production tracking fields if provided
        if (currentOrderId !== undefined) updateData.currentOrderId = currentOrderId;
        if (startTime !== undefined) updateData.startTime = startTime;
        if (estimatedEndTime !== undefined) updateData.estimatedEndTime = estimatedEndTime;
        if (notes !== undefined) updateData.notes = notes;

        // Handle status transitions
        if (status === "In Use" && !startTime) {
            updateData.startTime = new Date();
        }
        
        if (status === "Available") {
            // Clear production tracking when machine becomes available
            updateData.currentOrderId = null;
            updateData.startTime = null;
            updateData.estimatedEndTime = null;
        }

        const machine = await Machine.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).populate('currentOrderId', 'orderId status');

        if (!machine) {
            return next(new ApiError('Machine not found', 404));
        }

        // Create notifications for important status changes
        if (status === "Out of Order") {
            await notificationService.notifyAdmins(
                'machine_breakdown',
                `Machine Out of Order Alert`,
                `${machine.name} has been marked as Out of Order.`,
                machine._id,
                'Machine'
            );
        } else if (status === "Under Maintenance") {
            await notificationService.notifyAdmins(
                'machine_maintenance',
                `Machine Maintenance Alert`,
                `${machine.name} is now under maintenance.`,
                machine._id,
                'Machine'
            );
        }

        res.status(200).json({
            success: true,
            message: 'Machine status updated successfully',
            data: machine,
        });
    } catch (error) {
        next(error);
    }
};

// Assign operator to machine
exports.assignOperator = async (req, res, next) => {
    try {
        const { operatorId } = req.body;

        if (!operatorId) {
            return next(new ApiError('Operator ID is required', 400));
        }

        const User = require('../UserManagement/User');
        const operator = await User.findById(operatorId);

        if (!operator || operator.role !== 'staff_operator') {
            return next(new ApiError('Invalid operator ID', 400));
        }

        const machine = await Machine.findByIdAndUpdate(
            req.params.id,
            { operatorId },
            { new: true, runValidators: true }
        ).populate('operatorId', 'name email phone');

        if (!machine) {
            return next(new ApiError('Machine not found', 404));
        }

        res.status(200).json({
            success: true,
            message: 'Operator assigned to machine successfully',
            data: machine,
        });
    } catch (error) {
        next(error);
    }
};

// Get machine load (number of pending/in-progress jobs)
exports.getMachineLoad = async (req, res, next) => {
    try {
        const machineId = req.params.id;

        const machine = await Machine.findById(machineId);
        if (!machine) {
            return next(new ApiError('Machine not found', 404));
        }

        const Schedule = require('../ScheduleManagement/model');
        const loadingJobs = await Schedule.countDocuments({
            machineId,
            status: { $in: ['queued', 'in_progress'] },
        });

        // Calculate workload ratio (assuming max capacity of 10 jobs)
        const maxCapacity = 10;
        const workloadRatio = Math.min(loadingJobs / maxCapacity, 1);

        res.status(200).json({
            success: true,
            data: {
                machineId,
                currentLoad: loadingJobs,
                maxCapacity,
                workloadRatio: parseFloat(workloadRatio.toFixed(2)),
            },
        });
    } catch (error) {
        next(error);
    }
};

// Update maintenance information
exports.updateMaintenance = async (req, res, next) => {
    try {
        const { lastMaintenanceDate, nextMaintenanceDate, maintenanceNotes } = req.body;
        
        const machine = await Machine.findByIdAndUpdate(
            req.params.id,
            {
                lastMaintenanceDate,
                nextMaintenanceDate,
                notes: maintenanceNotes
            },
            { new: true, runValidators: true }
        );

        if (!machine) {
            return next(new ApiError('Machine not found', 404));
        }

        res.status(200).json({
            success: true,
            message: 'Maintenance information updated successfully',
            data: machine,
        });
    } catch (error) {
        next(error);
    }
};

// Get machines by status for schedule manager
exports.getMachinesByStatus = async (req, res, next) => {
    try {
        const { status } = req.query;
        let filter = {};
        
        if (status) {
            filter.status = status;
        }
        
        const machines = await Machine.find(filter)
            .populate('operatorId', 'name email')
            .populate('currentOrderId', 'orderId status printSpecs')
            .sort({ status: 1, name: 1 });

        res.status(200).json({
            success: true,
            count: machines.length,
            data: machines,
        });
    } catch (error) {
        next(error);
    }
};

// Get production summary for all machines
exports.getProductionSummary = async (req, res, next) => {
    try {
        const machines = await Machine.find({})
            .populate('operatorId', 'name')
            .populate('currentOrderId', 'orderId status printSpecs');

        const summary = {
            totalMachines: machines.length,
            statusCounts: {},
            machinesInUse: [],
            upcomingMaintenance: [],
            productionDetails: []
        };

        // Count by status
        machines.forEach(machine => {
            summary.statusCounts[machine.status] = (summary.statusCounts[machine.status] || 0) + 1;
            
            // Track machines in use
            if (machine.status === 'In Use' && machine.currentOrderId) {
                summary.machinesInUse.push({
                    machineId: machine._id,
                    machineName: machine.name,
                    operatorName: machine.operatorId?.name || 'Unassigned',
                    orderId: machine.currentOrderId.orderId,
                    startTime: machine.startTime,
                    estimatedEndTime: machine.estimatedEndTime
                });
            }
            
            // Track upcoming maintenance
            if (machine.nextMaintenanceDate) {
                const daysUntilMaintenance = Math.ceil((machine.nextMaintenanceDate - new Date()) / (1000 * 60 * 60 * 24));
                if (daysUntilMaintenance <= 7) { // Next 7 days
                    summary.upcomingMaintenance.push({
                        machineId: machine._id,
                        machineName: machine.name,
                        nextMaintenanceDate: machine.nextMaintenanceDate,
                        daysUntilMaintenance
                    });
                }
            }
        });

        res.status(200).json({
            success: true,
            data: summary,
        });
    } catch (error) {
        next(error);
    }
};
