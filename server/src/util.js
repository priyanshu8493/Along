export const wrap = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

export function parseJson(value, fallback = null) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

export function validLatLng(lat, lng) {
  return isFiniteNumber(lat) && isFiniteNumber(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}
