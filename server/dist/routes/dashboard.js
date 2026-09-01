"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_js_1 = require("../db.js");
const auth_js_1 = require("../middleware/auth.js");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// ── GET /api/dashboard/stats ───────────────────────────────────────
router.get('/stats', auth_js_1.requireAuth, async (req, res) => {
    const isGlobal = req.user?.role === client_1.UserRole.ADMIN;
    const hospitalId = req.user?.hospital_id;
    const organWhere = isGlobal ? {} : { hospital_id: hospitalId };
    const recipientWhere = isGlobal ? {} : { hospital_id: hospitalId };
    const [activeDonors, activeRecipients, inTransitTransports, completedTransplants, totalHospitals, pendingHospitals,] = await Promise.all([
        db_js_1.prisma.organ.count({ where: { ...organWhere, status: client_1.OrganStatus.AVAILABLE, viability_deadline: { gt: new Date() } } }),
        db_js_1.prisma.recipient.count({ where: { ...recipientWhere, status: client_1.RecipientStatus.ACTIVE } }),
        db_js_1.prisma.transport.count({ where: { status: { in: [client_1.TransportStatus.DISPATCHED, client_1.TransportStatus.IN_TRANSIT] } } }),
        db_js_1.prisma.match.count({ where: { status: client_1.MatchStatus.COMPLETED } }),
        db_js_1.prisma.hospital.count(),
        db_js_1.prisma.hospital.count({ where: { status: 'PENDING' } }),
    ]);
    res.json({
        success: true,
        data: {
            active_donors: activeDonors,
            active_recipients: activeRecipients,
            in_transit_transports: inTransitTransports,
            completed_transplants: completedTransplants,
            total_hospitals: totalHospitals,
            pending_hospitals: pendingHospitals,
        },
    });
});
// ── GET /api/audit-logs (ADMIN Only) ───────────────────────────────
router.get('/audit-logs', auth_js_1.requireAuth, (0, auth_js_1.requireRole)(client_1.UserRole.ADMIN), async (req, res) => {
    const auditLogs = await db_js_1.prisma.auditLog.findMany({
        orderBy: { created_at: 'desc' },
        take: 100,
    });
    res.json({ success: true, data: auditLogs });
});
exports.default = router;
