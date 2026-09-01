"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_js_1 = require("../db.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
// ── POST /api/hospitals (Public Hospital Registration) ──────────────
router.post('/', async (req, res) => {
    const { hospital_name, registration_number, address, city, state, pincode, contact_email, contact_phone, admin_email, admin_password, admin_full_name, latitude, longitude } = req.body || {};
    if (!hospital_name || !registration_number || !contact_email || !admin_email || !admin_password || !admin_full_name) {
        res.status(422).json({ success: false, code: 'VALIDATION_ERROR', error: 'Missing required hospital or admin registration fields.' });
        return;
    }
    const existingReg = await db_js_1.prisma.hospital.findUnique({ where: { registration_number: String(registration_number) } });
    if (existingReg) {
        res.status(409).json({ success: false, code: 'CONFLICT', error: 'A hospital with this registration number already exists.' });
        return;
    }
    const existingEmail = await db_js_1.prisma.hospital.findUnique({ where: { contact_email: String(contact_email) } });
    if (existingEmail) {
        res.status(409).json({ success: false, code: 'CONFLICT', error: 'A hospital with this contact email already exists.' });
        return;
    }
    const existingUser = await db_js_1.prisma.user.findUnique({ where: { email: String(admin_email).toLowerCase().trim() } });
    if (existingUser) {
        res.status(409).json({ success: false, code: 'CONFLICT', error: 'An account with this admin email already exists.' });
        return;
    }
    const adminPasswordHash = await bcryptjs_1.default.hash(String(admin_password), 10);
    const result = await db_js_1.prisma.$transaction(async (tx) => {
        const hospital = await tx.hospital.create({
            data: {
                name: String(hospital_name),
                registration_number: String(registration_number),
                address: address ? String(address) : null,
                city: city ? String(city) : null,
                state: state ? String(state) : null,
                pincode: pincode ? String(pincode) : null,
                contact_email: String(contact_email),
                contact_phone: contact_phone ? String(contact_phone) : null,
                latitude: latitude ? parseFloat(String(latitude)) : null,
                longitude: longitude ? parseFloat(String(longitude)) : null,
                status: 'PENDING',
            },
        });
        const user = await tx.user.create({
            data: {
                email: String(admin_email).toLowerCase().trim(),
                password_hash: adminPasswordHash,
                full_name: String(admin_full_name),
                role: 'HOSPITAL_ADMIN',
                hospital_id: hospital.id,
            },
        });
        await tx.notification.create({
            data: {
                hospital_id: hospital.id,
                title: 'New Hospital Registration Pending',
                message: `${hospital.name} has submitted an application for NOTTO accreditation.`,
                notification_type: 'REGISTRATION_STATUS',
                action_url: '/admin/queue',
            },
        });
        return { hospital, user };
    });
    const { password_hash, reset_token, ...safeUser } = result.user;
    res.status(201).json({
        success: true,
        data: {
            hospital: result.hospital,
            admin_user: safeUser,
        },
        message: 'Hospital registered successfully. Your application is pending admin review.',
    });
});
// ── GET /api/hospitals ───────────────────────────────────────────────
router.get('/', auth_js_1.requireAuth, async (req, res) => {
    if (!req.user) {
        res.status(401).json({ success: false, code: 'UNAUTHORIZED', error: 'Authentication required.' });
        return;
    }
    if (req.user.role === 'ADMIN') {
        const statusParam = req.query.status;
        const whereClause = {};
        if (statusParam && ['PENDING', 'VERIFIED', 'REJECTED'].includes(statusParam.toUpperCase())) {
            whereClause.status = statusParam.toUpperCase();
        }
        const hospitals = await db_js_1.prisma.hospital.findMany({
            where: whereClause,
            orderBy: { created_at: 'desc' },
        });
        res.json({ success: true, data: hospitals });
        return;
    }
    if (!req.user.hospital_id) {
        res.json({ success: true, data: [] });
        return;
    }
    const hospital = await db_js_1.prisma.hospital.findUnique({ where: { id: req.user.hospital_id } });
    res.json({ success: true, data: hospital ? [hospital] : [] });
});
// ── GET /api/hospitals/:id ───────────────────────────────────────────
router.get('/:id', auth_js_1.requireAuth, async (req, res) => {
    const id = String(req.params.id);
    if (req.user?.role !== 'ADMIN' && req.user?.hospital_id !== id) {
        res.status(403).json({ success: false, code: 'FORBIDDEN', error: 'You can only view your own hospital.' });
        return;
    }
    const hospital = await db_js_1.prisma.hospital.findUnique({ where: { id } });
    if (!hospital) {
        res.status(404).json({ success: false, code: 'NOT_FOUND', error: 'Hospital not found.' });
        return;
    }
    res.json({ success: true, data: hospital });
});
// ── PATCH /api/hospitals/:id/approve (ADMIN Only) ───────────────────
router.patch('/:id/approve', auth_js_1.requireAuth, (0, auth_js_1.requireRole)('ADMIN'), async (req, res) => {
    const id = String(req.params.id);
    const hospital = await db_js_1.prisma.hospital.findUnique({ where: { id } });
    if (!hospital) {
        res.status(404).json({ success: false, code: 'NOT_FOUND', error: 'Hospital not found.' });
        return;
    }
    if (hospital.status !== 'PENDING') {
        res.status(409).json({ success: false, code: 'INVALID_TRANSITION', error: `Cannot approve hospital in '${hospital.status}' state.` });
        return;
    }
    const updated = await db_js_1.prisma.$transaction(async (tx) => {
        const h = await tx.hospital.update({
            where: { id },
            data: { status: 'VERIFIED' },
        });
        await tx.notification.create({
            data: {
                hospital_id: id,
                title: 'Hospital Accreditation Approved',
                message: `Congratulations! ${h.name} has been verified and granted full national transplant network access.`,
                notification_type: 'HOSPITAL_APPROVED',
                action_url: '/dashboard',
            },
        });
        await tx.auditLog.create({
            data: {
                actor_id: req.user?.id || null,
                actor_email: req.user?.email || null,
                action: 'APPROVE_HOSPITAL',
                resource_type: 'Hospital',
                resource_id: id,
                details: { hospital_name: h.name },
            },
        });
        return h;
    });
    res.json({ success: true, data: updated, message: `Hospital '${updated.name}' has been approved.` });
});
// ── PATCH /api/hospitals/:id/reject (ADMIN Only) ────────────────────
router.patch('/:id/reject', auth_js_1.requireAuth, (0, auth_js_1.requireRole)('ADMIN'), async (req, res) => {
    const id = String(req.params.id);
    const { reason } = req.body || {};
    const hospital = await db_js_1.prisma.hospital.findUnique({ where: { id } });
    if (!hospital) {
        res.status(404).json({ success: false, code: 'NOT_FOUND', error: 'Hospital not found.' });
        return;
    }
    if (hospital.status !== 'PENDING') {
        res.status(409).json({ success: false, code: 'INVALID_TRANSITION', error: `Cannot reject hospital in '${hospital.status}' state.` });
        return;
    }
    const updated = await db_js_1.prisma.$transaction(async (tx) => {
        const h = await tx.hospital.update({
            where: { id },
            data: {
                status: 'REJECTED',
                rejection_reason: reason ? String(reason) : 'Failed accreditation check.',
            },
        });
        await tx.notification.create({
            data: {
                hospital_id: id,
                title: 'Hospital Registration Not Approved',
                message: `Your registration was rejected. Reason: ${h.rejection_reason}`,
                notification_type: 'HOSPITAL_REJECTED',
                action_url: '/rejected',
            },
        });
        return h;
    });
    res.json({ success: true, data: updated, message: `Hospital '${updated.name}' has been rejected.` });
});
exports.default = router;
