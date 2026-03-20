const mongoose = require("mongoose");

const DesignTemplateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    type: {
        type: String, // poster, banner, etc
        required: true
    },
    layoutJson: {
        type: Object, // Stores layout configuration (x, y, font, zones)
        required: true
    },
    defaultColors: {
        type: [String]
    },
    previewImageUrl: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("DesignTemplate", DesignTemplateSchema);
