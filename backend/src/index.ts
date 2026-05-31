import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import routes from './routes';

dotenv.config();

const app  = express();
const PORT = Number(process.env.PORT ?? 4000);

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  credentials: true,
}));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests' },
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (_req, res) => {
  res.json({
    name: 'AURA SMM Backend',
    status: 'ok',
    docs: {
      health: '/health',
      apiBase: '/api',
      usersMe: '/api/users/me',
      orders: '/api/orders',
    },
  });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.get('/api', (_req, res) => {
  res.json({
    message: 'API is running',
    endpoints: ['/api/users/me', '/api/orders'],
  });
});

app.use('/api', routes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`Backend running -> http://localhost:${PORT}`);
});

export default app;
