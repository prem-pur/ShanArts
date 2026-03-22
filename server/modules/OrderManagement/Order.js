const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
    customerId: {
        type: String,
        required: true
    },
    designType: {
        type: String, // e.g., 'Poster', 'Banner'
        required: true
    },
    size: {
        type: String, // e.g., 'A4', '100x100'
        required: true
    },
    colors: {
        type: String, // e.g., 'Red', '#FF0000'
        required: true
    },
    textContent: {
        type: String,
        required: true
    },
    specialInstructions: {
        type: String
    },
    designPreviewUrl: {
        type: String // Path to generated PNG
    },
    feedback: {
        type: String // Reason for rejection
    },
    status: {
        type: String,
        enum: ["Pending", "Generated", "Approved", "Rejected", "Regenerating", "Printing"],
        default: "Pending"
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Order", OrderSchema);
