const mongoose = require('mongoose');

const stockTransactionSchema = new mongoose.Schema(
    {
        materialId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Material',
            required: true,
        },
        type: {
            type: String,
            enum: ['stock_in', 'stock_out', 'adjustment'],
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
        },
        referenceId: mongoose.Schema.Types.ObjectId,
        notes: String,
        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('StockTransaction', stockTransactionSchema);
