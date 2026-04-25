const express = require('express');
const rateLimit = require('express-rate-limit');
const ApiError = require('../../utils/apiError');
const mlService = require('../../services/mlService');

const router = express.Router();

const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
});

function isValidDateStr(s) {
    if (typeof s !== 'string' || !s.trim()) return false;
    const d = new Date(s);
    return !Number.isNaN(d.getTime());
}

function validate(body) {
    const fields = {};
    const requiredDates = ['Order_Request_Date', 'Assigned_Date', 'Estimated_End_Date'];
    for (const k of requiredDates) {
        if (!isValidDateStr(body[k])) fields[k] = 'Must be a valid date string';
    }

    const q = Number(body.Quantity);
    if (!Number.isFinite(q) || q <= 0) fields.Quantity = 'Must be a positive number';

    const mw = Number(body.Assigned_Machine_Workload);
    if (!Number.isFinite(mw) || mw < 0 || mw > 100) fields.Assigned_Machine_Workload = 'Must be between 0 and 100';

    const ow = Number(body.Assigned_Operator_Workload);
    if (!Number.isFinite(ow) || ow < 0 || ow > 100) fields.Assigned_Operator_Workload = 'Must be between 0 and 100';

    const c = body.Current_Queued_Jobs_Count;
    if (!Number.isInteger(c) || c < 0) fields.Current_Queued_Jobs_Count = 'Must be a non-negative integer';

    if (body.Priority != null) {
        const p = String(body.Priority).trim();
        if (p !== 'Normal' && p !== 'Urgent') fields.Priority = 'Must be "Normal" or "Urgent"';
    }

    return fields;
}

router.post('/predict', limiter, async (req, res, next) => {
    try {
        const fields = validate(req.body || {});
        if (Object.keys(fields).length > 0) {
            return res.status(422).json({ error: 'Validation failed', fields });
        }

        const ok = await mlService.checkModelHealth();
        if (!ok) {
            return res.status(503).json({ error: 'Model service unavailable' });
        }

        const payload = {
            Order_Request_Date: req.body.Order_Request_Date,
            Requested_Deadline_Date: req.body.Requested_Deadline_Date,
            Assigned_Date: req.body.Assigned_Date,
            Estimated_End_Date: req.body.Estimated_End_Date,
            Quantity: Number(req.body.Quantity),
            Assigned_Machine_Workload: Number(req.body.Assigned_Machine_Workload),
            Assigned_Operator_Workload: Number(req.body.Assigned_Operator_Workload),
            Current_Queued_Jobs_Count: Number(req.body.Current_Queued_Jobs_Count),
            Priority: req.body.Priority || 'Normal',
        };

        // Optional fields supported by the trained pipeline (improves accuracy when provided)
        if (req.body.Job_Type) payload.Job_Type = String(req.body.Job_Type);
        if (req.body.Color_Type) payload.Color_Type = String(req.body.Color_Type);
        if (req.body.Material_Type) payload.Material_Type = String(req.body.Material_Type);
        if (req.body.Active_Machines_Count != null) payload.Active_Machines_Count = Number(req.body.Active_Machines_Count);
        if (req.body.Total_Machines_Count != null) payload.Total_Machines_Count = Number(req.body.Total_Machines_Count);
        if (req.body.Available_Staff_Count != null) payload.Available_Staff_Count = Number(req.body.Available_Staff_Count);
        if (req.body.Total_Staff_Count != null) payload.Total_Staff_Count = Number(req.body.Total_Staff_Count);

        const result = await mlService.predict(payload);
        return res.status(200).json(result);
    } catch (err) {
        // Do not expose traceback; log inside mlService already
        if (err instanceof ApiError) return next(err);
        return res.status(500).json({ error: 'Prediction failed' });
    }
});

module.exports = router;

