"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_js_1 = require("../db.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
// ── POST /api/organs (Create Donor Organ) ─────────────────────────
router.post('/', auth_js_1.requireAuth, auth_js_1.requireVerifiedHospital, async (req, res) => {
    const { organ_type, blood_group, hla_typing, cold_ischemia_hours, donor_age, donor_gender, notes, cause_of_death, donor_ref } = req.body || {};
    if (!organ_type || !blood_group) {
        res.status(422).json({ success: false, code: 'VALIDATION_ERROR', error: 'Missing organ_type or blood_group.' });
        return;
    }
    const hospitalId = req.user?.hospital_id;
    if (!hospitalId && req.user?.role !== 'ADMIN') {
        res.status(403).json({ success: false, code: 'FORBIDDEN', error: 'Admin must specify hospital_id.' });
        return;
    }
    const targetHospitalId = hospitalId || String(req.body.hospital_id);
    const hours = cold_ischemia_hours ? parseInt(String(cold_ischemia_hours)) : 12;
    const deadline = new Date(Date.now() + hours * 3600 * 1000);
    const refNumber = donor_ref ? String(donor_ref) : `L-DONOR-${Math.floor(100 + Math.random() * 900)}`;
    const organ = await db_js_1.prisma.organ.create({
        data: {
            hospital_id: targetHospitalId,
            donor_ref: refNumber,
            organ_type: String(organ_type).toUpperCase(),
            blood_group: String(blood_group).toUpperCase(),
            hla_typing: hla_typing || null,
            cold_ischemia_hours: hours,
            donor_age: donor_age ? parseInt(String(donor_age)) : null,
            donor_gender: donor_gender ? String(donor_gender) : null,
            notes: notes ? String(notes) : null,
            cause_of_death: cause_of_death ? String(cause_of_death) : null,
            viability_deadline: deadline,
            status: 'AVAILABLE',
        },
        include: { hospital: true },
    });
    res.status(201).json({ success: true, data: organ, message: 'Donor organ listing created successfully.' });
});
// ── GET /api/organs ───────────────────────────────────────────────
router.get('/', auth_js_1.requireAuth, async (req, res) => {
    const { status, organ_type, available_only } = req.query;
    const whereClause = {};
    if (req.user?.role !== 'ADMIN') {
        whereClause.hospital_id = req.user?.hospital_id || undefined;
    }
    if (available_only === 'true') {
        whereClause.status = 'AVAILABLE';
        whereClause.viability_deadline = { gt: new Date() };
    }
    else if (status) {
        whereClause.status = String(status).toUpperCase();
    }
    if (organ_type) {
        whereClause.organ_type = String(organ_type).toUpperCase();
    }
    const organs = await db_js_1.prisma.organ.findMany({
        where: whereClause,
        include: { hospital: true },
        orderBy: { created_at: 'desc' },
    });
    res.json({ success: true, data: organs });
});
// ── GET /api/organs/available ─────────────────────────────────────
router.get('/available', auth_js_1.requireAuth, async (req, res) => {
    const organs = await db_js_1.prisma.organ.findMany({
        where: {
            status: 'AVAILABLE',
            viability_deadline: { gt: new Date() },
        },
        include: { hospital: true },
        orderBy: { created_at: 'desc' },
    });
    res.json({ success: true, data: organs });
});
// ── GET /api/organs/:id ───────────────────────────────────────────
router.get('/:id', auth_js_1.requireAuth, async (req, res) => {
    const id = String(req.params.id);
    const organ = await db_js_1.prisma.organ.findUnique({
        where: { id },
        include: { hospital: true },
    });
    if (!organ) {
        res.status(404).json({ success: false, code: 'NOT_FOUND', error: 'Organ not found.' });
        return;
    }
    if (req.user?.role !== 'ADMIN' && req.user?.hospital_id !== organ.hospital_id) {
        res.status(403).json({ success: false, code: 'FORBIDDEN', error: 'You can only view your own hospital organs.' });
        return;
    }
    res.json({ success: true, data: organ });
});
// ── PATCH /api/organs/:id ─────────────────────────────────────────
router.patch('/:id', auth_js_1.requireAuth, auth_js_1.requireVerifiedHospital, async (req, res) => {
    const id = String(req.params.id);
    const { notes, status } = req.body || {};
    const organ = await db_js_1.prisma.organ.findUnique({ where: { id } });
    if (!organ) {
        res.status(404).json({ success: false, code: 'NOT_FOUND', error: 'Organ not found.' });
        return;
    }
    if (req.user?.role !== 'ADMIN' && req.user?.hospital_id !== organ.hospital_id) {
        res.status(403).json({ success: false, code: 'FORBIDDEN', error: 'You do not own this organ listing.' });
        return;
    }
    const updateData = {};
    if (notes !== undefined)
        updateData.notes = String(notes);
    if (status !== undefined)
        updateData.status = String(status).toUpperCase();
    const updated = await db_js_1.prisma.organ.update({
        where: { id },
        data: updateData,
        include: { hospital: true },
    });
    res.json({ success: true, data: updated, message: 'Organ updated successfully.' });
});
exports.default = router;
