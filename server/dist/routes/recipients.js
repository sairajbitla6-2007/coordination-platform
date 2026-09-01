"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_js_1 = require("../db.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
// ── POST /api/recipients (Create Recipient Listing) ───────────────
router.post('/', auth_js_1.requireAuth, auth_js_1.requireVerifiedHospital, async (req, res) => {
    const { organ_needed, blood_group, hla_typing, urgency_level, patient_ref, age, gender, ward } = req.body || {};
    if (!organ_needed || !blood_group) {
        res.status(422).json({ success: false, code: 'VALIDATION_ERROR', error: 'Missing organ_needed or blood_group.' });
        return;
    }
    const hospitalId = req.user?.hospital_id;
    if (!hospitalId && req.user?.role !== 'ADMIN') {
        res.status(403).json({ success: false, code: 'FORBIDDEN', error: 'Admin must specify hospital_id.' });
        return;
    }
    const targetHospitalId = hospitalId || String(req.body.hospital_id);
    const refNumber = patient_ref ? String(patient_ref) : `PT-${Math.floor(1000 + Math.random() * 9000)}`;
    const recipient = await db_js_1.prisma.recipient.create({
        data: {
            hospital_id: targetHospitalId,
            patient_ref: refNumber,
            organ_needed: String(organ_needed).toUpperCase(),
            blood_group: String(blood_group).toUpperCase(),
            hla_typing: hla_typing || null,
            urgency_level: (urgency_level ? String(urgency_level) : 'MEDIUM').toUpperCase(),
            age: age ? parseInt(String(age)) : null,
            gender: gender ? String(gender) : null,
            ward: ward ? String(ward) : null,
            registered_at: new Date(),
            status: 'ACTIVE',
        },
        include: { hospital: true },
    });
    res.status(201).json({ success: true, data: recipient, message: 'Recipient registered on national waiting list.' });
});
// ── GET /api/recipients ───────────────────────────────────────────
router.get('/', auth_js_1.requireAuth, async (req, res) => {
    const { urgency_level, organ_needed, status } = req.query;
    const whereClause = {};
    if (req.user?.role !== 'ADMIN') {
        whereClause.hospital_id = req.user?.hospital_id || undefined;
    }
    if (status) {
        whereClause.status = String(status).toUpperCase();
    }
    else {
        whereClause.status = 'ACTIVE';
    }
    if (urgency_level) {
        whereClause.urgency_level = String(urgency_level).toUpperCase();
    }
    if (organ_needed) {
        whereClause.organ_needed = String(organ_needed).toUpperCase();
    }
    const recipients = await db_js_1.prisma.recipient.findMany({
        where: whereClause,
        include: { hospital: true },
        orderBy: { registered_at: 'asc' },
    });
    res.json({ success: true, data: recipients });
});
// ── GET /api/recipients/:id ───────────────────────────────────────
router.get('/:id', auth_js_1.requireAuth, async (req, res) => {
    const id = String(req.params.id);
    const recipient = await db_js_1.prisma.recipient.findUnique({
        where: { id },
        include: { hospital: true },
    });
    if (!recipient) {
        res.status(404).json({ success: false, code: 'NOT_FOUND', error: 'Recipient not found.' });
        return;
    }
    if (req.user?.role !== 'ADMIN' && req.user?.hospital_id !== recipient.hospital_id) {
        res.status(403).json({ success: false, code: 'FORBIDDEN', error: 'You can only view your own hospital recipients.' });
        return;
    }
    res.json({ success: true, data: recipient });
});
// ── PATCH /api/recipients/:id ─────────────────────────────────────
router.patch('/:id', auth_js_1.requireAuth, auth_js_1.requireVerifiedHospital, async (req, res) => {
    const id = String(req.params.id);
    const { urgency_level, status } = req.body || {};
    const recipient = await db_js_1.prisma.recipient.findUnique({ where: { id } });
    if (!recipient) {
        res.status(404).json({ success: false, code: 'NOT_FOUND', error: 'Recipient not found.' });
        return;
    }
    if (req.user?.role !== 'ADMIN' && req.user?.hospital_id !== recipient.hospital_id) {
        res.status(403).json({ success: false, code: 'FORBIDDEN', error: 'You do not own this recipient entry.' });
        return;
    }
    const updateData = {};
    if (urgency_level !== undefined)
        updateData.urgency_level = String(urgency_level).toUpperCase();
    if (status !== undefined)
        updateData.status = String(status).toUpperCase();
    const updated = await db_js_1.prisma.recipient.update({
        where: { id },
        data: updateData,
        include: { hospital: true },
    });
    res.json({ success: true, data: updated, message: 'Recipient updated successfully.' });
});
exports.default = router;
