const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema(
    {
        invoiceNumber: {
            type: String,
            unique: true,
            required: true,
        },
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ShopOrder',
            required: true,
        },
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        lineItems: [
            {
                description: String,
                quantity: Number,
                unitPrice: Number,
                total: Number,
            },
        ],
        subtotal: Number,
        tax: Number,
        discount: Number,
        totalAmount: Number,
        amountPaid: {
            type: Number,
            default: 0,
        },
        balanceDue: Number,
        paymentStatus: {
            type: String,
            enum: ['unpaid', 'partial', 'pending_approval', 'paid'],
            default: 'unpaid',
        },
        dueDate: Date,
        issuedAt: Date,
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Invoice', invoiceSchema);
