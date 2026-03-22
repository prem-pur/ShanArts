const mongoose = require("mongoose");

const CustomerRequestSchema = new mongoose.Schema({
    customerId: {
        type: String,
        required: true
    },
    productType: {
        type: String,
        required: true
    },
    size: {
        type: String, // e.g., 'A4', 'Banner Large'
        required: true
    },
    textContent: {
        type: String
    },
    imageUrls: [{
        type: String
    }],
    colorPreferences: {
        type: String
    },
    deadline: {
        type: Date
    },
    status: {
        type: String,
        enum: ["Pending Review", "Approved", "Rejected"],
        default: "Pending Review"
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("CustomerRequest", CustomerRequestSchema);
