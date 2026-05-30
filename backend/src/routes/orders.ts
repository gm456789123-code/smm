import { Router } from 'express';
import db from '../config/database';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { RowDataPacket } from 'mysql2';

const router = Router();

// GET /api/orders — user's own orders
router.get('/', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT * FROM transactions WHERE user_id=? ORDER BY created_at DESC LIMIT 50',
      [req.user!.userId]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// GET /api/orders/all — admin: all orders
router.get('/all', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT t.*, u.username FROM transactions t
       JOIN users u ON t.user_id = u.id
       ORDER BY t.created_at DESC LIMIT 200`
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

export default router;
