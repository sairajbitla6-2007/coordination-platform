import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './routes/auth.js';
import hospitalsRouter from './routes/hospitals.js';
import organsRouter from './routes/organs.js';
import recipientsRouter from './routes/recipients.js';
import matchesRouter from './routes/matches.js';
import transportsRouter from './routes/transports.js';
import notificationsRouter from './routes/notifications.js';
import dashboardRouter from './routes/dashboard.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

// ── Middlewares ───────────────────────────────────────────────────
app.use(
  cors({
    origin: [CORS_ORIGIN, 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());

// ── Health Check ──────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'OrganLink Node.js Express API', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'OrganLink Node.js Express API', timestamp: new Date().toISOString() });
});

// ── Mount Routers ─────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/hospitals', hospitalsRouter);
app.use('/api/organs', organsRouter);
app.use('/api/recipients', recipientsRouter);
app.use('/api/matches', matchesRouter);
app.use('/api/transports', transportsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api', dashboardRouter);

// ── Error Handlers ────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, code: 'NOT_FOUND', error: `Endpoint '${req.originalUrl}' not found.` });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
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
