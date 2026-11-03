import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db.js';
import { JWT_SECRET } from '../config.js';
import { requireAuth } from '../middleware/auth.js';
import { shapeUser } from '../serializers.js';
import { wrap, httpError } from '../util.js';

const router = Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sign(user) {
  return jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: '30d' });
}

router.post(
  '/register',
  wrap(async (req, res) => {
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (name.length < 2) throw httpError(400, 'Please enter your name.');
    if (!EMAIL_RE.test(email)) throw httpError(400, 'Please enter a valid email address.');
    if (password.length < 6) throw httpError(400, 'Password must be at least 6 characters.');

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) throw httpError(409, 'That email is already registered. Try signing in.');

    const hash = await bcrypt.hash(password, 10);
    const info = db
      .prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)')
      .run(name, email, hash);
    const user = db
      .prepare('SELECT id, name, email FROM users WHERE id = ?')
      .get(info.lastInsertRowid);

    res.status(201).json({ token: sign(user), user: shapeUser(user) });
  }),
);

router.post(
  '/login',
  wrap(async (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!row) throw httpError(401, 'Email or password is incorrect.');

    const ok = await bcrypt.compare(password, row.password_hash);
    if (!ok) throw httpError(401, 'Email or password is incorrect.');

    res.json({ token: sign(row), user: shapeUser(row) });
  }),
);

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: shapeUser(req.user) });
});

export default router;
