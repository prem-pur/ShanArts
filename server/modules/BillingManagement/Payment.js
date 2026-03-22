const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
    {
        invoiceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Invoice',
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        method: {
            type: String,
            enum: ['cash', 'bank_transfer', 'card', 'online'],
            required: true,
        },
        reference: String,
        recordedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: false,
        },
        paidAt: Date,
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Payment', paymentSchema);
