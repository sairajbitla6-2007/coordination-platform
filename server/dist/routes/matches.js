"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_js_1 = require("../db.js");
const auth_js_1 = require("../middleware/auth.js");
const matchingEngine_js_1 = require("../services/matchingEngine.js");
const router = (0, express_1.Router)();
// ── GET /api/matches/candidates/organ/:organ_id ───────────────────
router.get('/candidates/organ/:organ_id', auth_js_1.requireAuth, async (req, res) => {
    const organ_id = String(req.params.organ_id);
    const organ = await db_js_1.prisma.organ.findUnique({
        where: { id: organ_id },
        include: { hospital: true },
    });
    if (!organ) {
        res.status(404).json({ success: false, code: 'NOT_FOUND', error: 'Organ listing not found.' });
        return;
    }
    if (req.user?.role !== 'ADMIN' && req.user?.hospital_id !== organ.hospital_id) {
        res.status(403).json({ success: false, code: 'FORBIDDEN', error: 'You can only run match engine for your own hospital organs.' });
        return;
    }
    if (organ.status !== 'AVAILABLE') {
        res.status(400).json({ success: false, code: 'ORGAN_NOT_AVAILABLE', error: `Organ status is '${organ.status}'. Matching requires AVAILABLE status.` });
        return;
    }
    const recipients = await db_js_1.prisma.recipient.findMany({
        where: {
            organ_needed: organ.organ_type,
            status: 'ACTIVE',
        },
        include: { hospital: true },
    });
    const candidates = [];
    for (const rec of recipients) {
        const scoreResult = (0, matchingEngine_js_1.calculateMatchScore)({
            donorBloodGroup: organ.blood_group,
            recipientBloodGroup: rec.blood_group,
            donorHla: organ.hla_typing,
            recipientHla: rec.hla_typing,
            donorLat: organ.hospital?.latitude,
            donorLon: organ.hospital?.longitude,
            recipientLat: rec.hospital?.latitude,
            recipientLon: rec.hospital?.longitude,
            urgencyLevel: rec.urgency_level,
            registeredAt: rec.registered_at,
            coldIschemiaHours: organ.cold_ischemia_hours,
        });
        if (scoreResult.compatible) {
            candidates.push({
                recipient: rec,
                recipient_id: rec.id,
                hospital_name: rec.hospital.name,
                hospital_city: rec.hospital.city,
                compatibility_score: scoreResult.breakdown.composite,
                distance_km: scoreResult.distanceKm,
                estimated_transit_minutes: scoreResult.transitMinutes,
                score_breakdown: scoreResult.breakdown,
            });
        }
    }
    candidates.sort((a, b) => b.compatibility_score - a.compatibility_score);
    candidates.forEach((c, idx) => (c.rank = idx + 1));
    res.json({
        success: true,
        data: {
            organ,
            total_candidates: candidates.length,
            candidates,
        },
    });
});
// ── GET /api/matches/candidates/recipient/:recipient_id ─────────────
router.get('/candidates/recipient/:recipient_id', auth_js_1.requireAuth, async (req, res) => {
    const recipient_id = String(req.params.recipient_id);
    const recipient = await db_js_1.prisma.recipient.findUnique({
        where: { id: recipient_id },
        include: { hospital: true },
    });
    if (!recipient) {
        res.status(404).json({ success: false, code: 'NOT_FOUND', error: 'Recipient not found.' });
        return;
    }
    const organs = await db_js_1.prisma.organ.findMany({
        where: {
            organ_type: recipient.organ_needed,
            status: 'AVAILABLE',
            viability_deadline: { gt: new Date() },
        },
        include: { hospital: true },
    });
    const candidates = [];
    for (const organ of organs) {
        const scoreResult = (0, matchingEngine_js_1.calculateMatchScore)({
            donorBloodGroup: organ.blood_group,
            recipientBloodGroup: recipient.blood_group,
            donorHla: organ.hla_typing,
            recipientHla: recipient.hla_typing,
            donorLat: organ.hospital?.latitude,
            donorLon: organ.hospital?.longitude,
            recipientLat: recipient.hospital?.latitude,
            recipientLon: recipient.hospital?.longitude,
            urgencyLevel: recipient.urgency_level,
            registeredAt: recipient.registered_at,
            coldIschemiaHours: organ.cold_ischemia_hours,
        });
        if (scoreResult.compatible) {
            candidates.push({
                organ,
                organ_id: organ.id,
                hospital_name: organ.hospital.name,
                hospital_city: organ.hospital.city,
                compatibility_score: scoreResult.breakdown.composite,
                distance_km: scoreResult.distanceKm,
                estimated_transit_minutes: scoreResult.transitMinutes,
                score_breakdown: scoreResult.breakdown,
            });
        }
    }
    candidates.sort((a, b) => b.compatibility_score - a.compatibility_score);
    candidates.forEach((c, idx) => (c.rank = idx + 1));
    res.json({
        success: true,
        data: {
            recipient,
            total_candidates: candidates.length,
            candidates,
        },
    });
});
// ── POST /api/matches/propose ──────────────────────────────────────
router.post('/propose', auth_js_1.requireAuth, auth_js_1.requireVerifiedHospital, async (req, res) => {
    const { organ_id, recipient_id } = req.body || {};
    if (!organ_id || !recipient_id) {
        res.status(422).json({ success: false, code: 'VALIDATION_ERROR', error: 'organ_id and recipient_id are required.' });
        return;
    }
    const organ = await db_js_1.prisma.organ.findUnique({ where: { id: String(organ_id) }, include: { hospital: true } });
    const recipient = await db_js_1.prisma.recipient.findUnique({ where: { id: String(recipient_id) }, include: { hospital: true } });
    if (!organ || !recipient) {
        res.status(404).json({ success: false, code: 'NOT_FOUND', error: 'Organ or recipient not found.' });
        return;
    }
    const scoreResult = (0, matchingEngine_js_1.calculateMatchScore)({
        donorBloodGroup: organ.blood_group,
        recipientBloodGroup: recipient.blood_group,
        donorHla: organ.hla_typing,
        recipientHla: recipient.hla_typing,
        donorLat: organ.hospital?.latitude,
        donorLon: organ.hospital?.longitude,
        recipientLat: recipient.hospital?.latitude,
        recipientLon: recipient.hospital?.longitude,
        urgencyLevel: recipient.urgency_level,
        registeredAt: recipient.registered_at,
        coldIschemiaHours: organ.cold_ischemia_hours,
    });
    if (!scoreResult.compatible) {
        res.status(400).json({ success: false, code: 'INCOMPATIBLE_MATCH', error: 'Organ and recipient are blood incompatible.' });
        return;
    }
    const respondBy = new Date(Date.now() + 45 * 60 * 1000);
    const match = await db_js_1.prisma.$transaction(async (tx) => {
        const m = await tx.match.create({
            data: {
                organ_id: String(organ_id),
                recipient_id: String(recipient_id),
                composite_score: scoreResult.breakdown.composite,
                distance_km: scoreResult.distanceKm,
                transit_time_minutes: scoreResult.transitMinutes,
                score_breakdown: scoreResult.breakdown,
                status: 'PROPOSED',
                proposed_at: new Date(),
                respond_by: respondBy,
            },
            include: {
                organ: { include: { hospital: true } },
                recipient: { include: { hospital: true } },
            },
        });
        await tx.notification.create({
            data: {
                hospital_id: recipient.hospital_id,
                title: `URGENT: Incoming Match Proposal - ${organ.organ_type}`,
                message: `${organ.hospital.name} proposed ${organ.organ_type} for patient ${recipient.patient_ref}. 45m response countdown.`,
                notification_type: 'PROPOSAL_RECEIVED',
                action_url: '/requests',
            },
        });
        return m;
    });
    res.status(201).json({ success: true, data: match, message: 'Match proposal transmitted successfully.' });
});
// ── PATCH /api/matches/:id/accept ──────────────────────────────────
router.patch('/:id/accept', auth_js_1.requireAuth, auth_js_1.requireVerifiedHospital, async (req, res) => {
    const id = String(req.params.id);
    const match = await db_js_1.prisma.match.findUnique({
        where: { id },
        include: {
            organ: { include: { hospital: true } },
            recipient: { include: { hospital: true } },
        },
    });
    if (!match) {
        res.status(404).json({ success: false, code: 'NOT_FOUND', error: 'Match proposal not found.' });
        return;
    }
    if (match.status !== 'PROPOSED') {
        res.status(409).json({ success: false, code: 'INVALID_TRANSITION', error: `Match status is '${match.status}'. Cannot accept.` });
        return;
    }
    const result = await db_js_1.prisma.$transaction(async (tx) => {
        const updatedMatch = await tx.match.update({
            where: { id },
            data: {
                status: 'CONFIRMED',
                responded_at: new Date(),
            },
            include: {
                organ: { include: { hospital: true } },
                recipient: { include: { hospital: true } },
            },
        });
        await tx.organ.update({ where: { id: match.organ_id }, data: { status: 'MATCHED' } });
        await tx.recipient.update({ where: { id: match.recipient_id }, data: { status: 'MATCHED' } });
        const transport = await tx.transport.create({
            data: {
                match_id: id,
                status: 'PENDING',
                preservation_box_id: `LIFELINK-BOX-${Math.floor(100 + Math.random() * 900)}`,
                current_temp_celsius: 3.6,
                battery_level: 95,
                gps_speed_kmh: 0,
                eta_minutes: match.transit_time_minutes,
                vehicle_type: 'GREEN_CORRIDOR_AMBULANCE',
                tracking_number: `LL-TRK-2026-${Math.floor(10000 + Math.random() * 90000)}`,
                driver_name: 'Captain Rajesh V. (Emergency Logistics)',
                driver_phone: '+91 99887 66554',
                checkpoints: [
                    { title: 'Organ Retrieval & Cross-Clamp Sign-off', completed: true, location: `${match.organ.hospital.name} Surgical Suite` },
                    { title: 'Cold Preservation Box Sealed & QA Verified', completed: true, location: 'Ambulance Departure Bay' },
                    { title: 'Green Corridor Tollway Transit', completed: false, location: 'Expressway Air/Ground Route' },
                    { title: 'Recipient OT Handoff & Surgery Prep', completed: false, location: match.recipient.hospital.name },
                ],
            },
        });
        await tx.notification.createMany({
            data: [
                {
                    hospital_id: match.organ.hospital_id,
                    title: `Match Confirmed: ${match.organ.organ_type}`,
                    message: `${match.recipient.hospital.name} confirmed match! Prepare organ dispatch.`,
                    notification_type: 'MATCH_CONFIRMED',
                    action_url: `/transport/${id}`,
                },
                {
                    hospital_id: match.recipient.hospital_id,
                    title: `Match Confirmed: ${match.organ.organ_type}`,
                    message: `Match confirmed. Transport tracking initialized.`,
                    notification_type: 'MATCH_CONFIRMED',
                    action_url: `/transport/${id}`,
                },
            ],
        });
        return { match: updatedMatch, transport };
    });
    res.json({ success: true, data: result, message: 'Match proposal accepted. Transport tracking initiated.' });
});
// ── PATCH /api/matches/:id/reject ──────────────────────────────────
router.patch('/:id/reject', auth_js_1.requireAuth, auth_js_1.requireVerifiedHospital, async (req, res) => {
    const id = String(req.params.id);
    const { reason } = req.body || {};
    const match = await db_js_1.prisma.match.findUnique({
        where: { id },
        include: { organ: true, recipient: true },
    });
    if (!match) {
        res.status(404).json({ success: false, code: 'NOT_FOUND', error: 'Match proposal not found.' });
        return;
    }
    const updated = await db_js_1.prisma.$transaction(async (tx) => {
        const m = await tx.match.update({
            where: { id },
            data: {
                status: 'REJECTED',
                responded_at: new Date(),
                rejection_reason: reason ? String(reason) : 'Declined by recipient clinical team.',
            },
        });
        await tx.organ.update({ where: { id: match.organ_id }, data: { status: 'AVAILABLE' } });
        await tx.recipient.update({ where: { id: match.recipient_id }, data: { status: 'ACTIVE' } });
        return m;
    });
    res.json({ success: true, data: updated, message: 'Match proposal declined. Listings returned to active pool.' });
});
// ── GET /api/matches ───────────────────────────────────────────────
router.get('/', auth_js_1.requireAuth, async (req, res) => {
    const matches = await db_js_1.prisma.match.findMany({
        include: {
            organ: { include: { hospital: true } },
            recipient: { include: { hospital: true } },
            transport: true,
        },
        orderBy: { created_at: 'desc' },
    });
    res.json({ success: true, data: matches });
});
exports.default = router;
