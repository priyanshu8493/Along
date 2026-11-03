import jwt from 'jsonwebtoken';
import { db } from '../db.js';
import { JWT_SECRET } from '../config.js';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Please sign in to continue.' });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = db
      .prepare('SELECT id, name, email FROM users WHERE id = ?')
      .get(payload.sub);
    if (!user) return res.status(401).json({ error: 'Account not found.' });
    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ error: 'Your session expired. Please sign in again.' });
  }
}
