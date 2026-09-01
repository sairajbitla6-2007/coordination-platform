"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const db_js_1 = require("../db.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || 'organlink_jwt_super_secret_key_2026_dev';
const ALLOWED_PREF_KEYS = ['urgent_alerts', 'sound_alerts', 'digest'];
// ── POST /api/auth/login ───────────────────────────────────────────
router.post('/login', async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
        res.status(422).json({ success: false, code: 'VALIDATION_ERROR', error: 'Email and password are required.' });
        return;
    }
    const user = await db_js_1.prisma.user.findUnique({
        where: { email: String(email).toLowerCase().trim() },
        include: { hospital: true },
    });
    if (!user || !user.is_active) {
        res.status(401).json({ success: false, code: 'AUTH_FAILED', error: 'Invalid email or password.' });
        return;
    }
    const passwordValid = await bcryptjs_1.default.compare(String(password), user.password_hash);
    if (!passwordValid) {
        res.status(401).json({ success: false, code: 'AUTH_FAILED', error: 'Invalid email or password.' });
        return;
    }
    // If user belongs to hospital, verify status
    if (user.role !== 'ADMIN' && user.hospital) {
        if (user.hospital.status === 'PENDING') {
            res.status(403).json({ success: false, code: 'HOSPITAL_PENDING', error: 'Your hospital registration is pending admin approval.' });
            return;
        }
        if (user.hospital.status === 'REJECTED') {
            res.status(403).json({ success: false, code: 'HOSPITAL_REJECTED', error: `Your hospital registration was rejected. Reason: ${user.hospital.rejection_reason || 'Contact support.'}` });
            return;
        }
    }
    const token = jsonwebtoken_1.default.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    const { password_hash, reset_token, ...safeUser } = user;
    res.json({
        success: true,
        data: {
            access_token: token,
            token_type: 'Bearer',
            user: safeUser,
        },
    });
});
// ── GET /api/auth/me ───────────────────────────────────────────────
router.get('/me', auth_js_1.requireAuth, async (req, res) => {
    if (!req.user) {
        res.status(401).json({ success: false, code: 'UNAUTHORIZED', error: 'Not authenticated.' });
        return;
    }
    const { password_hash, reset_token, ...safeUser } = req.user;
    res.json({ success: true, data: safeUser });
});
// ── POST /api/auth/register (Staff Creation) ─────────────────────
router.post('/register', auth_js_1.requireAuth, (0, auth_js_1.requireRole)('HOSPITAL_ADMIN'), async (req, res) => {
    const { email, password, full_name, role } = req.body || {};
    if (!email || !password || !full_name || !role) {
        res.status(422).json({ success: false, code: 'VALIDATION_ERROR', error: 'Missing required fields (email, password, full_name, role).' });
        return;
    }
    const existing = await db_js_1.prisma.user.findUnique({ where: { email: String(email).toLowerCase().trim() } });
    if (existing) {
        res.status(409).json({ success: false, code: 'CONFLICT', error: 'An account with this email already exists.' });
        return;
    }
    const passwordHash = await bcryptjs_1.default.hash(String(password), 10);
    const newUser = await db_js_1.prisma.user.create({
        data: {
            email: String(email).toLowerCase().trim(),
            password_hash: passwordHash,
            full_name: String(full_name),
            role: role,
            hospital_id: req.user?.hospital_id,
        },
    });
    const { password_hash, reset_token, ...safeUser } = newUser;
    res.status(201).json({ success: true, data: safeUser, message: 'Staff user created successfully.' });
});
// ── GET /api/auth/preferences ─────────────────────────────────────
router.get('/preferences', auth_js_1.requireAuth, async (req, res) => {
    const prefs = req.user?.preferences || {};
    res.json({
        success: true,
        data: {
            preferences: {
                urgent_alerts: prefs.urgent_alerts ?? true,
                sound_alerts: prefs.sound_alerts ?? true,
                digest: prefs.digest ?? false,
            },
        },
        message: 'Preferences retrieved.',
    });
});
// ── PATCH /api/auth/preferences ───────────────────────────────────
router.patch('/preferences', auth_js_1.requireAuth, async (req, res) => {
    const payload = req.body || {};
    const current = req.user?.preferences || { urgent_alerts: true, sound_alerts: true, digest: false };
    const validated = {};
    for (const [k, v] of Object.entries(payload)) {
        if (ALLOWED_PREF_KEYS.includes(k) && typeof v === 'boolean') {
            validated[k] = v;
        }
    }
    if (Object.keys(validated).length === 0) {
        res.status(422).json({ success: false, code: 'VALIDATION_ERROR', error: `No valid preference keys supplied. Accepted: ${ALLOWED_PREF_KEYS.join(', ')}` });
        return;
    }
    const updatedPrefs = { ...current, ...validated };
    const updatedUser = await db_js_1.prisma.user.update({
        where: { id: req.user.id },
        data: { preferences: updatedPrefs },
    });
    res.json({
        success: true,
        data: { preferences: updatedUser.preferences },
        message: 'Preferences saved successfully.',
    });
});
// ── POST /api/auth/forgot-password ─────────────────────────────────
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body || {};
    if (!email) {
        res.status(422).json({ success: false, code: 'VALIDATION_ERROR', error: 'Email is required.' });
        return;
    }
    const user = await db_js_1.prisma.user.findUnique({ where: { email: String(email).toLowerCase().trim() } });
    if (!user || !user.is_active) {
        res.json({ success: true, data: {}, message: 'If that email exists, reset instructions have been issued.' });
        return;
    }
    const token = crypto_1.default.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600 * 1000);
    await db_js_1.prisma.user.update({
        where: { id: user.id },
        data: { reset_token: token, reset_token_expires_at: expiresAt },
    });
    res.json({
        success: true,
        data: {
            reset_token: token,
            expires_in_minutes: 60,
            email: user.email,
            _demo_note: 'Token returned directly because no email service is configured.',
        },
        message: 'Password reset token generated.',
    });
});
// ── POST /api/auth/reset-password ──────────────────────────────────
router.post('/reset-password', async (req, res) => {
    const { token, new_password } = req.body || {};
    if (!token || !new_password) {
        res.status(422).json({ success: false, code: 'VALIDATION_ERROR', error: 'Token and new_password are required.' });
        return;
    }
    const newPassStr = String(new_password);
    if (newPassStr.length < 8) {
        res.status(422).json({ success: false, code: 'VALIDATION_ERROR', error: 'Password must be at least 8 characters long.' });
        return;
    }
    const user = await db_js_1.prisma.user.findFirst({
        where: {
            reset_token: String(token),
            reset_token_expires_at: { gt: new Date() },
        },
    });
    if (!user) {
        res.status(400).json({ success: false, code: 'TOKEN_INVALID', error: 'Reset token is invalid or has expired.' });
        return;
    }
    const passwordHash = await bcryptjs_1.default.hash(newPassStr, 10);
    await db_js_1.prisma.user.update({
        where: { id: user.id },
        data: {
            password_hash: passwordHash,
            reset_token: null,
            reset_token_expires_at: null,
        },
    });
    res.json({ success: true, data: { email: user.email }, message: 'Password updated successfully.' });
});
exports.default = router;
