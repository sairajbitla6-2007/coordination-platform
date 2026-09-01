"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_js_1 = __importDefault(require("./routes/auth.js"));
const hospitals_js_1 = __importDefault(require("./routes/hospitals.js"));
const organs_js_1 = __importDefault(require("./routes/organs.js"));
const recipients_js_1 = __importDefault(require("./routes/recipients.js"));
const matches_js_1 = __importDefault(require("./routes/matches.js"));
const transports_js_1 = __importDefault(require("./routes/transports.js"));
const notifications_js_1 = __importDefault(require("./routes/notifications.js"));
const dashboard_js_1 = __importDefault(require("./routes/dashboard.js"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';
// ── Middlewares ───────────────────────────────────────────────────
app.use((0, cors_1.default)({
    origin: [CORS_ORIGIN, 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express_1.default.json());
// ── Health Check ──────────────────────────────────────────────────
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'OrganLink Node.js Express API', timestamp: new Date().toISOString() });
});
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'OrganLink Node.js Express API', timestamp: new Date().toISOString() });
});
// ── Mount Routers ─────────────────────────────────────────────────
app.use('/api/auth', auth_js_1.default);
app.use('/api/hospitals', hospitals_js_1.default);
app.use('/api/organs', organs_js_1.default);
app.use('/api/recipients', recipients_js_1.default);
app.use('/api/matches', matches_js_1.default);
app.use('/api/transports', transports_js_1.default);
app.use('/api/notifications', notifications_js_1.default);
app.use('/api', dashboard_js_1.default);
// ── Error Handlers ────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ success: false, code: 'NOT_FOUND', error: `Endpoint '${req.originalUrl}' not found.` });
});
app.use((err, req, res, next) => {
    console.error('❌ Server Error:', err);
    res.status(err.status || 500).json({
        success: false,
        code: err.code || 'SERVER_ERROR',
        error: err.message || 'An unexpected server error occurred.',
    });
});
// ── Start Server ──────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`🚀 OrganLink Node.js Express Server running on http://localhost:${PORT}`);
    console.log(`🔗 API Base: http://localhost:${PORT}/api`);
});
