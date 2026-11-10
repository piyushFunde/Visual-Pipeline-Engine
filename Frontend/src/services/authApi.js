// services/authApi.js
const BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080';

async function request(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method:      'POST',
    credentials: 'include',
    headers:     { 'Content-Type': 'application/json' },
    body:        JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data.message || data.error || `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return data;
}

/** POST /auth/register */
export function register({ email, password, marketingOptIn }) {
  return request('/auth/register', { email, password, marketingOptIn });
}

/** POST /auth/login */
export function login({ email, password }) {
  return request('/auth/login', { email, password });
}

/** GET /auth/me – restore session */
export async function getMe() {
  const res = await fetch(`${BASE}/auth/me`, {
    method:      'GET',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Not authenticated');
  return res.json();
}
