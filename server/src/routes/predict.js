const express = require('express');
const rateLimit = require('express-rate-limit');

const mlService = require('../services/mlService');

const router = express.Router();

const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
});

const ALLOWED = {
    Job_Type: ['Flyers', 'Banners', 'Stickers', 'Brochures', 'Business Cards', 'Posters'],
    Color_Type: ['BW', 'Full Color'],
    Material_Type: ['Vinyl', 'Glossy Paper', 'Cardboard', 'Matte Paper', 'Canvas'],
    Priority: ['Normal', 'Urgent'],
};

function isValidIsoDate(s) {
    if (typeof s !== 'string' || !s.trim()) return false;
    const d = new Date(s);
    return !Number.isNaN(d.getTime());
}

function validate(body) {
    const fields = {};

    // required
    const required = [
        'Job_Type',
        'Quantity',
        'Color_Type',
        'Material_Type',
        'Order_Request_Date',
        'Requested_Deadline_Date',
        'Assigned_Date',
        'Estimated_End_Date',
        'Current_Queued_Jobs_Count',
        'Active_Machines_Count',
        'Total_Machines_Count',
        'Available_Staff_Count',
        'Total_Staff_Count',
        'Assigned_Machine_Workload',
        'Assigned_Operator_Workload',
    ];
    for (const k of required) {
        if (body[k] == null || body[k] === '') fields[k] = 'Required';
    }

    // enums
    if (body.Job_Type && !ALLOWED.Job_Type.includes(String(body.Job_Type))) {
        fields.Job_Type = `Must be one of: ${ALLOWED.Job_Type.join(', ')}`;
    }
    if (body.Color_Type && !ALLOWED.Color_Type.includes(String(body.Color_Type))) {
        fields.Color_Type = `Must be one of: ${ALLOWED.Color_Type.join(', ')}`;
    }
    if (body.Material_Type && !ALLOWED.Material_Type.includes(String(body.Material_Type))) {
        fields.Material_Type = `Must be one of: ${ALLOWED.Material_Type.join(', ')}`;
    }
    if (body.Priority != null && body.Priority !== '') {
        if (!ALLOWED.Priority.includes(String(body.Priority))) {
            fields.Priority = 'Must be "Normal" or "Urgent"';
        }
    }

    // numeric constraints
    const qty = Number(body.Quantity);
    if (!Number.isFinite(qty) || qty <= 0) fields.Quantity = 'Must be a positive number';

    const mw = Number(body.Assigned_Machine_Workload);
    if (!Number.isFinite(mw) || mw < 0 || mw > 100) fields.Assigned_Machine_Workload = 'Must be between 0 and 100';

    const ow = Number(body.Assigned_Operator_Workload);
    if (!Number.isFinite(ow) || ow < 0 || ow > 100) fields.Assigned_Operator_Workload = 'Must be between 0 and 100';

    const nonNegInt = (k) => {
        const v = Number(body[k]);
        if (!Number.isInteger(v) || v < 0) fields[k] = 'Must be a non-negative integer';
        return v;
    };
    nonNegInt('Current_Queued_Jobs_Count');
    nonNegInt('Active_Machines_Count');
    nonNegInt('Available_Staff_Count');

    const totalMachines = Number(body.Total_Machines_Count);
    if (!Number.isInteger(totalMachines) || totalMachines < 1) fields.Total_Machines_Count = 'Must be an integer >= 1';

    const totalStaff = Number(body.Total_Staff_Count);
    if (!Number.isInteger(totalStaff) || totalStaff < 1) fields.Total_Staff_Count = 'Must be an integer >= 1';

    // dates (do not enforce ordering; warn only)
    const dateKeys = ['Order_Request_Date', 'Requested_Deadline_Date', 'Assigned_Date', 'Estimated_End_Date'];
    for (const k of dateKeys) {
        if (body[k] && !isValidIsoDate(body[k])) fields[k] = 'Must be a valid ISO date string (YYYY-MM-DD)';
    }

    return fields;
}

router.post('/predict', limiter, async (req, res) => {
    const fields = validate(req.body || {});
    if (Object.keys(fields).length > 0) {
        return res.status(422).json({ error: true, message: 'Validation failed', fields });
    }

    const ok = await mlService.checkModelHealth();
    if (!ok) {
        return res.status(503).json({ error: true, message: 'ML server unavailable' });
    }

    const payload = {
        Job_Type: String(req.body.Job_Type),
        Quantity: Number(req.body.Quantity),
        Color_Type: String(req.body.Color_Type),
        Material_Type: String(req.body.Material_Type),
        Order_Request_Date: String(req.body.Order_Request_Date),
        Requested_Deadline_Date: String(req.body.Requested_Deadline_Date),
        Assigned_Date: String(req.body.Assigned_Date),
        Estimated_End_Date: String(req.body.Estimated_End_Date),
        Current_Queued_Jobs_Count: Number(req.body.Current_Queued_Jobs_Count),
        Active_Machines_Count: Number(req.body.Active_Machines_Count),
        Total_Machines_Count: Number(req.body.Total_Machines_Count),
        Available_Staff_Count: Number(req.body.Available_Staff_Count),
        Total_Staff_Count: Number(req.body.Total_Staff_Count),
        Priority: req.body.Priority ? String(req.body.Priority) : 'Normal',
        Assigned_Machine_Workload: Number(req.body.Assigned_Machine_Workload),
        Assigned_Operator_Workload: Number(req.body.Assigned_Operator_Workload),
    };

    // warn only (do not reject)
    try {
        const t0 = new Date(payload.Order_Request_Date).getTime();
        const t1 = new Date(payload.Assigned_Date).getTime();
        const t2 = new Date(payload.Estimated_End_Date).getTime();
        if (!(t0 <= t1 && t1 <= t2)) {
            // eslint-disable-next-line no-console
            console.warn('[predict] Date order unusual (processing anyway):', payload.Order_Request_Date, payload.Assigned_Date, payload.Estimated_End_Date);
        }
    } catch {
        // ignore
    }

    try {
        const result = await mlService.predict(payload);
        return res.status(200).json(result);
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[predict] Prediction failed:', err && err.stack ? err.stack : err);
        return res.status(500).json({ error: true, message: 'Prediction failed' });
    }
});

module.exports = router;

