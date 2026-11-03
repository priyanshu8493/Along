import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { PORT, PRICING } from './config.js';
import authRoutes from './routes/auth.js';
import tripRoutes from './routes/trips.js';
import poolRoutes from './routes/pools.js';
import geoRoutes from './routes/geo.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'along-api', time: new Date().toISOString() });
});

app.get('/api/config', (req, res) => {
  res.json({ pricing: PRICING });
});

app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/pools', poolRoutes);
app.use('/api', geoRoutes);

// Unknown API routes should stay JSON, not fall through to the SPA.
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

// In production the built frontend is served by this same process.
const webDist = path.join(here, '..', '..', 'web', 'dist');
if (fs.existsSync(webDist)) {
  app.use(express.static(webDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(webDist, 'index.html'));
  });
}

app.use((err, req, res, next) => {
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({
    error: err.message || 'Something went wrong.',
  });
});

app.listen(PORT, () => {
  console.log(`\n  Along API running at http://localhost:${PORT}`);
  console.log(`  Health: http://localhost:${PORT}/api/health\n`);
});
