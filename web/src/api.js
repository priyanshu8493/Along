const BASE = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'along_token';

let token = localStorage.getItem(TOKEN_KEY) || null;

export function setToken(next) {
  token = next || null;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getToken() {
  return token;
}

export async function api(path, options = {}) {
  const { method = 'GET', body, auth = true, signal } = options;
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // Non-JSON response (e.g. a proxy error page).
  }

  if (!res.ok) {
    const err = new Error(data?.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}
