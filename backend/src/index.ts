import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import routes from './routes';

dotenv.config();

const app  = express();
const PORT = Number(process.env.PORT ?? 4000);

// ── Security ──────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin:      process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  credentials: true,
}));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max:      200,
  message:  { error: 'Too many requests' },
}));

// ── Body parser ───────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health check ──────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ── Routes ────────────────────────────────────────────
app.use('/api', routes);

// ── 404 ───────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ── Start ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Backend running → http://localhost:${PORT}`);
});

export default app;
