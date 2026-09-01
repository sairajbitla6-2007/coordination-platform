"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_js_1 = require("../db.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
// ── GET /api/transports/:match_id ──────────────────────────────────
router.get('/:match_id', auth_js_1.requireAuth, async (req, res) => {
    const match_id = String(req.params.match_id);
    const transport = await db_js_1.prisma.transport.findFirst({
        where: { match_id },
        include: {
            match: {
                include: {
                    organ: { include: { hospital: true } },
                    recipient: { include: { hospital: true } },
                },
            },
        },
    });
    if (!transport) {
        res.status(404).json({ success: false, code: 'NOT_FOUND', error: 'Transport tracking not found for this match.' });
        return;
    }
    res.json({ success: true, data: transport });
});
// ── PATCH /api/transports/:match_id ────────────────────────────────
router.patch('/:match_id', auth_js_1.requireAuth, auth_js_1.requireVerifiedHospital, async (req, res) => {
    const match_id = String(req.params.match_id);
    const { status, current_temp_celsius, battery_level, gps_speed_kmh, eta_minutes } = req.body || {};
    const transport = await db_js_1.prisma.transport.findFirst({
        where: { match_id },
        include: { match: true },
    });
    if (!transport || !transport.match) {
        res.status(404).json({ success: false, code: 'NOT_FOUND', error: 'Transport record not found.' });
        return;
    }
    const updateData = {};
    if (current_temp_celsius !== undefined)
        updateData.current_temp_celsius = parseFloat(String(current_temp_celsius));
    if (battery_level !== undefined)
        updateData.battery_level = parseInt(String(battery_level));
    if (gps_speed_kmh !== undefined)
        updateData.gps_speed_kmh = parseFloat(String(gps_speed_kmh));
    if (eta_minutes !== undefined)
        updateData.eta_minutes = parseInt(String(eta_minutes));
    if (status) {
        const nextStatus = String(status).toUpperCase();
        updateData.status = nextStatus;
        if (nextStatus === 'DISPATCHED') {
            updateData.dispatched_at = new Date();
            updateData.gps_speed_kmh = 65;
        }
        else if (nextStatus === 'IN_TRANSIT') {
            updateData.in_transit_at = new Date();
            updateData.gps_speed_kmh = 80;
        }
        else if (nextStatus === 'DELIVERED') {
            updateData.delivered_at = new Date();
            updateData.gps_speed_kmh = 0;
            updateData.eta_minutes = 0;
            await db_js_1.prisma.match.update({ where: { id: match_id }, data: { status: 'COMPLETED' } });
            await db_js_1.prisma.organ.update({ where: { id: transport.match.organ_id }, data: { status: 'COMPLETED' } });
            await db_js_1.prisma.recipient.update({ where: { id: transport.match.recipient_id }, data: { status: 'COMPLETED' } });
        }
    }
    const updated = await db_js_1.prisma.transport.update({
        where: { id: transport.id },
        data: updateData,
        include: { match: true },
    });
    res.json({ success: true, data: updated, message: 'Transport telemetry updated successfully.' });
});
exports.default = router;
