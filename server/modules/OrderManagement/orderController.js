const ShopOrder = require("./ShopOrder");
const ProductionOrder = require("./ProductionOrder");
const Schedule = require('../ScheduleManagement/model');
const ApiError = require('../../utils/apiError');
const generateOrderNumber = require('../../utils/generateOrderNumber');
const aiService = require('../../services/aiService');
const notificationService = require('../../services/notificationService');
const scheduleService = require('../../services/scheduleService');

const orderController = {
    // Create new order
    async createOrder(req, res, next) {
        try {
            let {
                jobType, description, quantity, dimensions, deadline, priority,
                address, deliveryMethod, preferences, customerPhone
            } = req.body;

            // Handle stringified objects from FormData
            if (typeof dimensions === 'string') {
                try {
                    dimensions = JSON.parse(dimensions);
                    // Ensure numbers are actually numbers
                    if (dimensions.width === '') dimensions.width = 0;
                    if (dimensions.height === '') dimensions.height = 0;
                    dimensions.width = Number(dimensions.width);
                    dimensions.height = Number(dimensions.height);
                } catch (e) { console.error("Error parsing dimensions:", e); }
            }
            if (typeof address === 'string') {
                try { address = JSON.parse(address); } catch (e) { console.error("Error parsing address:", e); }
            }

            const customerId = req.body.customerId || (req.user ? req.user._id : null);

            // Handle file uploads if present
            const samplePhoto = req.files?.samplePhoto?.[0]?.path ? `/uploads/${req.files.samplePhoto[0].filename}` : null;
            const designFiles = req.files?.designFiles?.map(f => `/uploads/${f.filename}`) || [];

            if (!jobType || !quantity) {
                throw new ApiError('Job type and quantity are required', 400);
            }

            const order = new ShopOrder({
                orderNumber: generateOrderNumber(),
                customerId,
                jobType,
                description,
                quantity,
                dimensions,
                deadline: deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 1 week
                priority: priority || 'normal',
                status: 'pending',
                address,
                deliveryMethod: deliveryMethod || 'pickup',
                preferences,
                customerPhone,
                samplePhoto,
                designFiles
            });

            await order.save();

            // Create corresponding ProductionOrder for designer workspace
            let customerName = 'Customer';
            if (customerId) {
                const User = require('../UserManagement/User');
                const customer = await User.findById(customerId);
                customerName = customer?.name || 'Customer';
            }

            const productionOrder = new ProductionOrder({
                customerName,
                customerId,
                orderId: order.orderNumber,
                printSpecs: {
                    designType: jobType,
                    size: dimensions || {},
                    quantity: quantity,
                    description: description,
                    deadline: deadline,
                    priority: priority,
                    address: address,
                    deliveryMethod: deliveryMethod,
                    preferences: preferences
                },
                staffId: req.user?._id || 'system',
                status: 'Draft',
                shopOrderId: order._id // Link back to original shop order
            });
            await productionOrder.save();

            // Notify admin about new order
            await notificationService.notifyAdmins(
                'order_update',
                `New Order: ${order.orderNumber}`,
                `New order received from customer. Quantity: ${quantity}`,
                order._id,
                'Order'
            );

            // Notify designers about new order in workspace
            await notificationService.notifyAdmins(
                'job_assigned',
                `New Design Task: ${order.orderNumber}`,
                `A new ${jobType} order requires design work.`,
                productionOrder._id,
                'ProductionOrder'
            );

            res.status(201).json({
                message: 'Order created successfully',
                order,
            });
        } catch (error) {
            next(error);
        }
    },

    // Get all orders (with filters)
    async getAllOrders(req, res, next) {
        try {
            const { status, customerId, priority, limit = 50 } = req.query;
            const filters = {};

            if (status) filters.status = status;
            if (customerId) filters.customerId = customerId;
            if (priority) filters.priority = priority;

            const orders = await ShopOrder.find(filters)
                .populate('customerId', 'name email')
                .populate('assignedOperatorId', 'name email')
                .populate('assignedMachineId', 'name type')
                .sort({ createdAt: -1 })
                .limit(parseInt(limit, 10));

            res.status(200).json({
                success: true,
                count: orders.length,
                orders,
            });
        } catch (error) {
            next(error);
        }
    },

    // Get customer's own orders
    async getMyOrders(req, res, next) {
        try {
            const orders = await ShopOrder.find({ customerId: req.user._id })
                .sort({ createdAt: -1 });

            res.json(orders);
        } catch (error) {
            next(error);
        }
    },

    // Get order by ID
    async getOrderById(req, res, next) {
        try {
            const order = await ShopOrder.findById(req.params.id)
                .populate('customerId', 'name email phone')
                .populate('assignedOperatorId', 'name')
                .populate('assignedMachineId', 'name type');

            if (!order) {
                throw new ApiError('Order not found', 404);
            }

            res.json(order);
        } catch (error) {
            next(error);
        }
    },

    // Update order
    async updateOrder(req, res, next) {
        try {
            let { description, quantity, dimensions, deadline, priority, totalPrice, paidAmount } = req.body;

            if (typeof dimensions === 'string') {
                try {
                    dimensions = JSON.parse(dimensions);
                    if (dimensions.width === '') dimensions.width = 0;
                    if (dimensions.height === '') dimensions.height = 0;
                    dimensions.width = Number(dimensions.width);
                    dimensions.height = Number(dimensions.height);
                } catch (e) { console.error("Error parsing dimensions:", e); }
            }

            const updates = {};

            if (description) updates.description = description;
            if (quantity) updates.quantity = quantity;
            if (dimensions) updates.dimensions = dimensions;
            if (deadline) updates.deadline = deadline;
            if (priority) updates.priority = priority;
            if (totalPrice !== undefined) updates.totalPrice = totalPrice;
            if (paidAmount !== undefined) updates.paidAmount = paidAmount;

            const order = await ShopOrder.findByIdAndUpdate(
                req.params.id,
                updates,
                { new: true }
            );

            if (!order) {
                throw new ApiError('Order not found', 404);
            }

            res.json({
                message: 'Order updated successfully',
                order,
            });
        } catch (error) {
            next(error);
        }
    },

    // Update order status
    async updateOrderStatus(req, res, next) {
        try {
            const { status, materialsUsed } = req.body;
            const validStatuses = ['pending', 'confirmed', 'in_progress', 'printing', 'completed', 'cancelled'];

            if (!validStatuses.includes(status)) {
                throw new ApiError('Invalid status', 400);
            }

            const order = await ShopOrder.findByIdAndUpdate(
                req.params.id,
                { status },
                { new: true }
            );

            if (!order) {
                throw new ApiError('Order not found', 404);
            }

            // Handle job completion (Inventory & Invoice)
            if (status === 'completed' && materialsUsed && Array.isArray(materialsUsed)) {
                order.materialsUsed = materialsUsed;
                await order.save();

                // 1. Subtract Stock (and get materials for pricing)
                const inventoryController = require('../InventoryManagement/inventoryController');
                const Material = require('../InventoryManagement/Material');

                const lineItems = [];
                for (const item of materialsUsed) {
                    // Fetch real material data for pricing
                    const material = await Material.findById(item.materialId);
                    const unitPrice = material ? material.costPerUnit : 100;
                    const materialName = material ? material.name : 'Unknown Material';

                    await inventoryController.subtractStock(
                        item.materialId,
                        item.quantity,
                        order.orderNumber,
                        req.user._id
                    );

                    lineItems.push({
                        description: `Material: ${materialName}`,
                        quantity: item.quantity,
                        unitPrice: unitPrice,
                        total: item.quantity * unitPrice
                    });
                }

                // 2. Generate Draft Invoice
                const invoiceController = require('../BillingManagement/invoiceController');

                // Add base job price
                lineItems.push({
                    description: `${order.jobType.toUpperCase()} Printing Job`,
                    quantity: 1,
                    unitPrice: order.totalPrice || 1500,
                    total: order.totalPrice || 1500
                });

                await invoiceController.generateInvoice({
                    body: {
                        orderId: order._id,
                        lineItems,
                        tax: 0,
                        discount: 0
                    },
                    user: req.user
                }, {
                    status: () => ({ json: () => { } }), // Mock res object
                }, (err) => { if (err) console.error("Invoice gen error:", err); });
            }

            // Notify customer of status change
            await notificationService.createNotification(
                order.customerId,
                'order_update',
                `Order ${order.orderNumber} Updated`,
                `Your order status has changed to: ${status.replace(/_/g, ' ').toUpperCase()}`,
                order._id,
                'Order'
            );

            res.json({
                message: 'Order status updated successfully',
                order,
            });
        } catch (error) {
            next(error);
        }
    },

    // Cancel order (customer if pending, admin always)
    async cancelOrder(req, res, next) {
        try {
            const order = await ShopOrder.findById(req.params.id);

            if (!order) {
                throw new ApiError('Order not found', 404);
            }

            // Check permissions
            if (req.user && req.user.role === 'customer' && order.status !== 'pending') {
                throw new ApiError('Can only cancel pending orders', 403);
            }

            order.status = 'cancelled';
            await order.save();

            // Notify admin of cancellation
            await notificationService.notifyAdmins(
                'order_update',
                `Order Cancelled: ${order.orderNumber}`,
                'An order has been cancelled',
                order._id,
                'Order'
            );

            res.json({
                message: 'Order cancelled successfully',
                order,
            });
        } catch (error) {
            next(error);
        }
    },

    // Delete order (admin only)
    async deleteOrder(req, res, next) {
        try {
            const order = await ShopOrder.findByIdAndDelete(req.params.id);

            if (!order) {
                throw new ApiError('Order not found', 404);
            }

            res.json({
                message: 'Order deleted successfully',
            });
        } catch (error) {
            next(error);
        }
    },

    // Assign order to operator and machine
    async assignOrder(req, res, next) {
        try {
            const { assignedOperatorId, assignedMachineId, estimatedCompletionTime, scheduledStart, scheduledEnd } = req.body;
            const order = await ShopOrder.findById(req.params.id);

            if (!order) {
                throw new ApiError('Order not found', 404);
            }

            // Time conflict check
            if (scheduledStart && scheduledEnd) {
                const start = new Date(scheduledStart);
                const end = new Date(scheduledEnd);

                const conflictingOrder = await ShopOrder.findOne({
                    status: { $in: ['confirmed', 'in_progress', 'printing'] },
                    _id: { $ne: req.params.id },
                    $or: [
                        { assignedMachineId },
                        { assignedOperatorId }
                    ],
                    $and: [
                        { scheduledStart: { $lt: end } },
                        { scheduledEnd: { $gt: start } }
                    ]
                }).populate('assignedOperatorId assignedMachineId');

                if (conflictingOrder) {
                    const conflictType = conflictingOrder.assignedMachineId?._id?.toString() === assignedMachineId ? 'Machine' : 'Operator';
                    throw new ApiError(`Schedule Conflict: The selected ${conflictType} is already booked for an order (#${conflictingOrder.orderNumber}) during this time slot.`, 400);
                }
            }

            order.assignedOperatorId = assignedOperatorId;
            order.assignedMachineId = assignedMachineId;
            order.estimatedCompletionTime = estimatedCompletionTime;
            if (scheduledStart) order.scheduledStart = scheduledStart;
            if (scheduledEnd) order.scheduledEnd = scheduledEnd;
            order.status = 'confirmed'; // Transition to confirmed once assigned

            await order.save();

            // Notify operator
            await notificationService.notifyUser(
                assignedOperatorId,
                'order_update',
                `New Task Assigned: ${order.orderNumber}`,
                `You have been assigned a new "${order.jobType}" print job.`,
                order._id,
                'ShopOrder'
            );

            res.json({ success: true, message: 'Order assigned successfully', order });
        } catch (error) {
            next(error);
        }
    },

    // Submit design to customer for approval
    async submitToCustomer(req, res, next) {
        try {
            let order = await ShopOrder.findById(req.params.id);
            let productionOrder;

            if (order) {
                order.status = 'waiting_approval';
                await order.save();
                productionOrder = await ProductionOrder.findOne({ shopOrderId: order._id });
            } else {
                // It might be a manual order, so the ID could be the ProductionOrderId
                productionOrder = await ProductionOrder.findById(req.params.id);
                if (!productionOrder) throw new ApiError('Order not found', 404);
            }

            if (productionOrder) {
                productionOrder.status = 'Sent to Customer';
                await productionOrder.save();
            }

            // Notify customer only if a ShopOrder exists
            if (order && order.customerId) {
                await notificationService.createNotification(
                    order.customerId,
                    'order_update',
                    'Design Ready for Review',
                    `The design for order #${order.orderNumber || order._id} is ready. Please review and approve.`,
                    order._id,
                    'Order'
                );
            }

            res.json({ message: 'Design submitted for customer approval', order: order || productionOrder });
        } catch (error) {
            next(error);
        }
    },

    // Process customer feedback (approve/reject)
    async processCustomerFeedback(req, res, next) {
        try {
            const { action, feedback } = req.body;
            const order = await ShopOrder.findById(req.params.id);
            if (!order) throw new ApiError('Order not found', 404);

            // Find and update corresponding ProductionOrder
            const productionOrder = await ProductionOrder.findOne({ shopOrderId: order._id });

            if (action === 'approve') {
                order.status = 'scheduled';
                order.revisionNotes = '';
                await order.save();

                if (productionOrder) {
                    productionOrder.status = 'Approved';
                    await productionOrder.save();
                }

                // Notify admin/designers
                await notificationService.notifyAdmins(
                    'order_update',
                    'Design Approved',
                    `Customer approved design for order #${order.orderNumber}. Ready for scheduling.`,
                    order._id,
                    'Order'
                );
            } else if (action === 'reject') {
                order.status = 'revision_requested';
                order.revisionNotes = feedback || '';
                await order.save();

                if (productionOrder) {
                    productionOrder.status = 'Rejected';
                    productionOrder.revisionNotes = feedback || '';
                    await productionOrder.save();
                }

                // Notify designers
                await notificationService.notifyAdmins(
                    'order_update',
                    'Design Rejected by Customer',
                    `Customer rejected the design for order #${order.orderNumber}. Reason: ${feedback}`,
                    order._id,
                    'Order'
                );
            } else {
                throw new ApiError('Invalid action. Use "approve" or "reject".', 400);
            }

            res.json({ message: `Order ${action}d successfully`, order });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = orderController;
