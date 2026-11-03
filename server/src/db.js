import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(here, '..', 'data');
fs.mkdirSync(dataDir, { recursive: true });

export const DB_PATH = process.env.DB_PATH || path.join(dataDir, 'along.db');

export const db = new DatabaseSync(DB_PATH);

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS trips (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    origin_name       TEXT NOT NULL,
    origin_lat        REAL NOT NULL,
    origin_lng        REAL NOT NULL,
    dest_name         TEXT NOT NULL,
    dest_lat          REAL NOT NULL,
    dest_lng          REAL NOT NULL,
    depart_at         TEXT NOT NULL,
    party_size        INTEGER NOT NULL DEFAULT 1,
    notes             TEXT,
    status            TEXT NOT NULL DEFAULT 'open',
    route_geojson     TEXT NOT NULL,
    route_distance_m  REAL NOT NULL,
    route_duration_s  REAL,
    route_source      TEXT NOT NULL DEFAULT 'osrm',
    created_at        TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_trips_depart ON trips (depart_at);
  CREATE INDEX IF NOT EXISTS idx_trips_user ON trips (user_id);
  CREATE INDEX IF NOT EXISTS idx_trips_status ON trips (status);

  CREATE TABLE IF NOT EXISTS pools (
    id                   INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_a_id            INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    trip_b_id            INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    shared_distance_m    REAL NOT NULL,
    combined_distance_m  REAL NOT NULL,
    fare_a               INTEGER NOT NULL,
    fare_b               INTEGER NOT NULL,
    shared_geojson       TEXT NOT NULL,
    status               TEXT NOT NULL DEFAULT 'active',
    created_at           TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (trip_a_id, trip_b_id)
  );
`);

export function closeDb() {
  db.close();
}
