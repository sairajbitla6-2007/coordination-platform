"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.requireRole = requireRole;
exports.requireVerifiedHospital = requireVerifiedHospital;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_js_1 = require("../db.js");
const JWT_SECRET = process.env.JWT_SECRET || 'organlink_jwt_super_secret_key_2026_dev';
async function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ success: false, code: 'INVALID_TOKEN', error: 'Missing or invalid authorization token.' });
        return;
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const userId = decoded.sub || decoded.id;
        if (!userId) {
            res.status(401).json({ success: false, code: 'INVALID_TOKEN', error: 'Invalid token payload.' });
            return;
        }
        const user = await db_js_1.prisma.user.findUnique({
            where: { id: userId },
            include: { hospital: true },
        });
        if (!user || !user.is_active) {
            res.status(401).json({ success: false, code: 'AUTH_FAILED', error: 'User account is inactive or not found.' });
            return;
        }
        req.user = user;
        next();
    }
    catch {
        res.status(401).json({ success: false, code: 'INVALID_TOKEN', error: 'Token verification failed or token expired.' });
    }
}
function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ success: false, code: 'UNAUTHORIZED', error: 'Authentication required.' });
            return;
        }
        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({ success: false, code: 'FORBIDDEN', error: `Role '${req.user.role}' is not permitted to perform this action.` });
            return;
        }
        next();
    };
}
function requireVerifiedHospital(req, res, next) {
    if (!req.user) {
        res.status(401).json({ success: false, code: 'UNAUTHORIZED', error: 'Authentication required.' });
        return;
    }
    if (req.user.role === 'ADMIN') {
        next();
        return;
    }
    if (!req.user.hospital_id || !req.user.hospital) {
        res.status(403).json({ success: false, code: 'FORBIDDEN', error: 'User is not associated with any hospital.' });
        return;
    }
    if (req.user.hospital.status !== 'VERIFIED') {
        res.status(403).json({ success: false, code: 'HOSPITAL_NOT_VERIFIED', error: `Hospital is in '${req.user.hospital.status}' status. Verification is required.` });
        return;
    }
    next();
}
