const express = require("express");
const router = express.Router();
const DesignTemplate = require("./DesignTemplate");

// GET All Templates
router.get("/", async (req, res) => {
    try {
        const templates = await DesignTemplate.find();
        res.json(templates);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CREATE Template (Seed/Admin)
router.post("/", async (req, res) => {
    try {
        const newTemplate = new DesignTemplate(req.body);
        const savedTemplate = await newTemplate.save();
        res.json(savedTemplate);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
