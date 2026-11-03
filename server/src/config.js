export const PORT = Number(process.env.PORT || 4000);
export const JWT_SECRET = process.env.JWT_SECRET || 'along-dev-secret-change-in-production';
export const OSRM_URL = process.env.OSRM_URL || 'https://router.project-osrm.org';
export const NOMINATIM_URL = process.env.NOMINATIM_URL || 'https://nominatim.openstreetmap.org';
export const APP_UA = 'AlongMVP/0.1 (route-pooling demo; contact: hello@along.app)';

// Fare model (INR). Kept in one place so the UI and API agree.
export const PRICING = {
  baseFare: 60,
  perKm: 14,
  maxPartySize: 3,
};
