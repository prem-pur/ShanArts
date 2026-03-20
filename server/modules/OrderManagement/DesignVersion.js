const mongoose = require("mongoose");

const DesignVersionSchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ProductionOrder",
        required: true
    },
    templateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DesignTemplate"
    },
    versionNumber: {
        type: Number,
        required: true
    },
    pngFilePath: {
        type: String,
        required: true
    },
    designData: {
        type: Object // Snapshot of data used to generate this version
    },
    createdBy: {
        type: String // Staff ID
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("DesignVersion", DesignVersionSchema);
