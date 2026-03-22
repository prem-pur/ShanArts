const express = require("express");
const router = express.Router();
const CustomerRequest = require("./CustomerRequest");

// CREATE Request (Public)
router.post("/create", async (req, res) => {
    try {
        const newRequest = new CustomerRequest(req.body);
        const savedRequest = await newRequest.save();
        res.json(savedRequest);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET Pending Requests (Staff)
router.get("/pending", async (req, res) => {
    try {
        const requests = await CustomerRequest.find({ status: "Pending Review" }).sort({ createdAt: -1 });
        res.json(requests);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET All Requests (Staff - optional history)
router.get("/", async (req, res) => {
    try {
        const requests = await CustomerRequest.find().sort({ createdAt: -1 });
        res.json(requests);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET Single Request
router.get("/:id", async (req, res) => {
    try {
        const request = await CustomerRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ error: "Request not found" });
        res.json(request);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
