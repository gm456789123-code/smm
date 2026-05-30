import { Router } from 'express';
import db from '../config/database';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = Router();

// GET /api/users/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT id, username, email, phone, balance, role, referral_code, created_at FROM users WHERE id = ?',
      [req.user!.userId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// PUT /api/users/me — update profile
router.put('/me', requireAuth, async (req, res) => {
  try {
    const { phone } = req.body;
    await db.query<ResultSetHeader>('UPDATE users SET phone=? WHERE id=?', [phone, req.user!.userId]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// GET /api/users — admin only
router.get('/', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT id, username, email, phone, balance, role, email_verified, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// PUT /api/users/:id/role — admin only
router.put('/:id/role', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) return res.status(400).json({ error: 'role ไม่ถูกต้อง' });
    await db.query('UPDATE users SET role=? WHERE id=?', [role, req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// PUT /api/users/:id/verify — admin: force verify email
router.put('/:id/verify', requireAuth, requireAdmin, async (req, res) => {
  try {
    await db.query('UPDATE users SET email_verified=1 WHERE id=?', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

export default router;
