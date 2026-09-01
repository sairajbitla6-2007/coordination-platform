"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_js_1 = require("../db.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
// ── GET /api/notifications ─────────────────────────────────────────
router.get('/', auth_js_1.requireAuth, async (req, res) => {
    const { unread_only } = req.query;
    const whereClause = {};
    if (req.user?.role !== 'ADMIN') {
        if (!req.user?.hospital_id) {
            res.json({ success: true, data: [], message: 'No hospital associated with user.' });
            return;
        }
        whereClause.hospital_id = req.user.hospital_id;
    }
    if (unread_only === 'true') {
        whereClause.is_read = false;
    }
    const notifications = await db_js_1.prisma.notification.findMany({
        where: whereClause,
        orderBy: { created_at: 'desc' },
    });
    res.json({ success: true, data: notifications, message: `Retrieved ${notifications.length} notification(s).` });
});
// ── PATCH /api/notifications/:id/read ─────────────────────────────
router.patch('/:id/read', auth_js_1.requireAuth, async (req, res) => {
    const id = String(req.params.id);
    const notif = await db_js_1.prisma.notification.findUnique({ where: { id } });
    if (!notif) {
        res.status(404).json({ success: false, code: 'NOT_FOUND', error: 'Notification not found.' });
        return;
    }
    if (req.user?.role !== 'ADMIN' && notif.hospital_id !== req.user?.hospital_id) {
        res.status(403).json({ success: false, code: 'FORBIDDEN', error: 'Notification belongs to another hospital.' });
        return;
    }
    const updated = await db_js_1.prisma.notification.update({
        where: { id },
        data: { is_read: true },
    });
    res.json({ success: true, data: updated, message: 'Notification marked as read.' });
});
// ── PATCH /api/notifications/read-all ──────────────────────────────
router.patch('/read-all', auth_js_1.requireAuth, async (req, res) => {
    const whereClause = { is_read: false };
    if (req.user?.role !== 'ADMIN') {
        if (!req.user?.hospital_id) {
            res.json({ success: true, data: { count: 0 } });
            return;
        }
        whereClause.hospital_id = req.user.hospital_id;
    }
    const batch = await db_js_1.prisma.notification.updateMany({
        where: whereClause,
        data: { is_read: true },
    });
    res.json({ success: true, data: { count: batch.count }, message: `Marked ${batch.count} notification(s) as read.` });
});
exports.default = router;
