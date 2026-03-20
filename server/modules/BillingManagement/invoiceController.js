const Invoice = require("./Invoice");
const Payment = require("./Payment");
const ShopOrder = require('../OrderManagement/ShopOrder');
const ApiError = require('../../utils/apiError');
const generateInvoiceNumber = require('../../utils/generateInvoiceNumber');

// Generate invoice for order
exports.generateInvoice = async (req, res, next) => {
    try {
        const { orderId, tax, discount, dueDate } = req.body;
        let { lineItems } = req.body;

        // Validate order
        const order = await ShopOrder.findById(orderId);
        if (!order) {
            return next(new ApiError('Order not found', 404));
        }

        // If no line items provided, use the order's total price as a single line item
        if (!lineItems || lineItems.length === 0) {
            lineItems = [{
                description: `${order.jobType.toUpperCase()} - Order #${order.orderNumber}`,
                quantity: order.quantity || 1,
                unitPrice: (order.totalPrice / (order.quantity || 1)) || 0,
                total: order.totalPrice || 0
            }];
        }

        // Check if invoice already exists
        const existingInvoice = await Invoice.findOne({ orderId });
        if (existingInvoice) {
            return next(new ApiError('Invoice already exists for this order', 409));
        }

        // Calculate subtotal
        const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        const taxAmount = tax || 0;
        const discountAmount = discount || 0;
        const totalAmount = subtotal + taxAmount - discountAmount;

        // Create invoice
        const invoice = new Invoice({
            invoiceNumber: generateInvoiceNumber(),
            orderId,
            customerId: order.customerId,
            lineItems,
            subtotal: parseFloat(subtotal.toFixed(2)),
            tax: parseFloat(taxAmount.toFixed(2)),
            discount: parseFloat(discountAmount.toFixed(2)),
            totalAmount: parseFloat(totalAmount.toFixed(2)),
            amountPaid: 0,
            balanceDue: parseFloat(totalAmount.toFixed(2)),
            paymentStatus: 'unpaid',
            dueDate: dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days default
        });

        await invoice.save();

        // Create notification for customer
        try {
            const Notification = require('../FeedbackNotificationManagement/Notification');
            await Notification.create({
                recipientId: order.customerId,
                type: 'payment_due',
                title: 'Invoice Generated',
                message: `Invoice #${invoice.invoiceNumber} for order #${order.orderNumber} is ready. Total: LKR ${totalAmount.toFixed(2)}`,
                relatedEntityId: invoice._id,
                relatedEntityType: 'Invoice',
            });
        } catch (notificationError) {
            console.error('Failed to create notification:', notificationError);
            // Don't fail the whole request if notification fails
        }

        res.status(201).json({
            success: true,
            message: 'Invoice generated successfully',
            data: await invoice.populate('orderId customerId'),
        });
    } catch (error) {
        next(error);
    }
};

// Get orders that need invoicing (completed or printing but no invoice)
exports.getPendingBillingOrders = async (req, res, next) => {
    try {
        // Find all orders that are completed or printing
        const orders = await ShopOrder.find({
            status: { $in: ['completed', 'printing'] }
        }).populate('customerId', 'name email');

        // Filter out those that already have an invoice
        const invoicedOrderIds = await Invoice.find().distinct('orderId');
        const pendingOrders = orders.filter(o => !invoicedOrderIds.map(id => id.toString()).includes(o._id.toString()));

        res.status(200).json({
            success: true,
            count: pendingOrders.length,
            data: pendingOrders,
        });
    } catch (error) {
        next(error);
    }
};

// Get all invoices (admin/finance staff)
exports.getAllInvoices = async (req, res, next) => {
    try {
        const { status, customerId, limit = 50 } = req.query;
        const filter = {};

        if (status) filter.paymentStatus = status;
        if (customerId) filter.customerId = customerId;

        const invoices = await Invoice.find(filter)
            .populate('orderId', 'orderNumber jobType deliveryMethod')
            .populate('customerId', 'name email')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit, 10));

        res.status(200).json({
            success: true,
            count: invoices.length,
            data: invoices,
        });
    } catch (error) {
        next(error);
    }
};

// Get customer's invoices
exports.getMyInvoices = async (req, res, next) => {
    try {
        const customerId = req.user._id;

        const invoices = await Invoice.find({ customerId })
            .populate('orderId', 'orderNumber jobType deliveryMethod')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: invoices.length,
            data: invoices,
        });
    } catch (error) {
        next(error);
    }
};

// Get invoice by ID
exports.getInvoiceById = async (req, res, next) => {
    try {
        const invoice = await Invoice.findById(req.params.id)
            .populate('orderId')
            .populate('customerId', 'name email phone');

        if (!invoice) {
            return next(new ApiError('Invoice not found', 404));
        }

        // Check access: customer can only see their own, staff can see all
        if (req.user.role === 'customer' && invoice.customerId._id.toString() !== req.user._id.toString()) {
            return next(new ApiError('Access denied', 403));
        }

        res.status(200).json({
            success: true,
            data: invoice,
        });
    } catch (error) {
        next(error);
    }
};

// Update invoice
exports.updateInvoice = async (req, res, next) => {
    try {
        const { lineItems, tax, discount, dueDate } = req.body;
        const invoice = await Invoice.findById(req.params.id);

        if (!invoice) {
            return next(new ApiError('Invoice not found', 404));
        }

        // Cannot update paid or partially paid invoices
        if (invoice.paymentStatus !== 'unpaid') {
            return next(
                new ApiError(
                    'Cannot update invoice that has been partially or fully paid',
                    400
                )
            );
        }

        // Recalculate totals
        if (lineItems) invoice.lineItems = lineItems;
        if (tax !== undefined) invoice.tax = parseFloat(tax.toFixed(2));
        if (discount !== undefined) invoice.discount = parseFloat(discount.toFixed(2));
        if (dueDate) invoice.dueDate = dueDate;

        const subtotal = invoice.lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        invoice.subtotal = parseFloat(subtotal.toFixed(2));
        invoice.totalAmount = parseFloat((subtotal + invoice.tax - invoice.discount).toFixed(2));
        invoice.balanceDue = parseFloat((invoice.totalAmount - invoice.amountPaid).toFixed(2));

        await invoice.save();

        res.status(200).json({
            success: true,
            message: 'Invoice updated successfully',
            data: invoice,
        });
    } catch (error) {
        next(error);
    }
};

// Record payment
exports.recordPayment = async (req, res, next) => {
    try {
        const { amount, method, reference } = req.body;
        const invoiceId = req.params.id;

        if (!amount || amount <= 0) {
            return next(new ApiError('Amount must be greater than 0', 400));
        }

        const invoice = await Invoice.findById(invoiceId);
        if (!invoice) {
            return next(new ApiError('Invoice not found', 404));
        }

        // Check if payment exceeds balance
        if (amount > invoice.balanceDue) {
            return next(
                new ApiError(
                    `Payment amount exceeds balance. Balance due: LKR ${invoice.balanceDue.toFixed(2)}`,
                    400
                )
            );
        }

        // Create payment record
        const payment = new Payment({
            invoiceId,
            amount: parseFloat(amount.toFixed(2)),
            method,
            reference,
            recordedBy: req.user._id,
        });

        await payment.save();

        // Update invoice
        invoice.amountPaid = parseFloat((invoice.amountPaid + amount).toFixed(2));
        invoice.balanceDue = parseFloat((invoice.balanceDue - amount).toFixed(2));

        if (invoice.balanceDue === 0) {
            invoice.paymentStatus = 'paid';
        } else {
            invoice.paymentStatus = 'partial';
        }

        await invoice.save();

        // Notify customer of payment
        const Notification = require('../FeedbackNotificationManagement/Notification');
        await Notification.create({
            recipientId: invoice.customerId,
            type: 'order_update',
            title: invoice.balanceDue <= 0 ? 'Full Payment Received' : 'Partial Payment Received',
            message: invoice.balanceDue <= 0
                ? `Thank you! We've received full payment of LKR ${amount.toLocaleString()} for Invoice #${invoice.invoiceNumber}.`
                : `We've received a payment of LKR ${amount.toLocaleString()} for Invoice #${invoice.invoiceNumber}. Remaining balance: LKR ${invoice.balanceDue.toLocaleString()}`,
            relatedEntityId: invoice._id,
            relatedEntityType: 'Invoice',
        });

        res.status(201).json({
            success: true,
            message: 'Payment recorded successfully',
            data: payment,
        });
    } catch (error) {
        next(error);
    }
};

// Get payment history for invoice
exports.getPaymentHistory = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Verify invoice exists
        const invoice = await Invoice.findById(id);
        if (!invoice) {
            return next(new ApiError('Invoice not found', 404));
        }

        const payments = await Payment.find({ invoiceId: id })
            .populate('recordedBy', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: payments.length,
            data: payments,
        });
    } catch (error) {
        next(error);
    }
};

// Get outstanding invoices
exports.getOutstandingInvoices = async (req, res, next) => {
    try {
        const invoices = await Invoice.find({
            paymentStatus: { $in: ['unpaid', 'partial'] },
        })
            .populate('orderId', 'orderNumber')
            .populate('customerId', 'name email')
            .sort({ dueDate: 1 });

        const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.balanceDue, 0);

        res.status(200).json({
            success: true,
            count: invoices.length,
            totalOutstanding: parseFloat(totalOutstanding.toFixed(2)),
            data: invoices,
        });
    } catch (error) {
        next(error);
    }
};
