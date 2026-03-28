// Base URL of your EduTrack backend
// Change this to your actual server address (LAN IP for physical device, localhost for emulator)
export const API_BASE = 'https://sms-uw9p.onrender.com/api/v1';

/**
 * Thin wrapper around fetch that attaches the parent token and
 * parses JSON automatically.
 *
 * @param {string} path  - e.g. '/portal/child/STM-2025-001'
 * @param {string} token - JWT from AuthContext
 * @param {RequestInit} [options]
 */
export async function apiFetch(path, token, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }

  return data;
}
