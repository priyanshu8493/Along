import { NOMINATIM_URL, APP_UA } from '../config.js';

const cache = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000;
const MAX_CACHE = 500;

function cacheGet(key) {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return hit.value;
}

function cacheSet(key, value) {
  if (cache.size >= MAX_CACHE) {
    const oldest = cache.keys().next().value;
    cache.delete(oldest);
  }
  cache.set(key, { at: Date.now(), value });
}

async function nominatim(path) {
  const res = await fetch(`${NOMINATIM_URL}${path}`, {
    headers: {
      'User-Agent': APP_UA,
      'Accept-Language': 'en',
    },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Geocoder responded ${res.status}`);
  return res.json();
}

function shortName(item) {
  const parts = String(item.display_name || '').split(',');
  return parts.slice(0, 3).join(',').trim() || item.name || 'Unknown place';
}

export async function geocode(query) {
  const q = String(query || '').trim();
  if (q.length < 3) return [];
  const key = `s:${q.toLowerCase()}`;
  const cached = cacheGet(key);
  if (cached) return cached;

  const params = new URLSearchParams({
    format: 'jsonv2',
    limit: '6',
    addressdetails: '0',
    q,
  });
  const data = await nominatim(`/search?${params}`);
  const results = (Array.isArray(data) ? data : []).map((r) => ({
    name: shortName(r),
    fullName: r.display_name,
    lat: Number(r.lat),
    lng: Number(r.lon),
  }));
  cacheSet(key, results);
  return results;
}

export async function reverseGeocode(lat, lng) {
  const key = `r:${lat.toFixed(5)},${lng.toFixed(5)}`;
  const cached = cacheGet(key);
  if (cached) return cached;

  const params = new URLSearchParams({
    format: 'jsonv2',
    lat: String(lat),
    lon: String(lng),
    zoom: '16',
  });
  const data = await nominatim(`/reverse?${params}`);
  const result = {
    name: shortName(data),
    fullName: data.display_name || '',
    lat,
    lng,
  };
  cacheSet(key, result);
  return result;
}
