import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Base URL of your EduTrack backend (see resolveApiBase below).

/**
 * Why "Network request failed" with backend on localhost:5000?
 * - On a real phone, `localhost` is the phone itself — nothing is listening there.
 * - On Android emulator, `localhost` is the emulator — use the host alias below.
 *
 * Fix for a physical device (same Wi‑Fi as your PC):
 *   Create `Frontend/.env` with:
 *     EXPO_PUBLIC_API_BASE=http://YOUR_PC_LAN_IP:5000/api/v1
 *   (Find IP: `ipconfig` on Windows → IPv4 Address.) Restart Expo after changing .env.
 *
 * Optional production / hosted API — uncomment and set EXPO_PUBLIC_API_BASE in EAS secrets instead.
 */
function resolveApiBase() {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE;
  if (fromEnv && String(fromEnv).trim()) {
    return String(fromEnv).trim().replace(/\/$/, '');
  }

  if (__DEV__) {
    // Android emulator: map to the machine running Metro + your Node server
    const isSimulator = Constants.isDevice === false;
    if (Platform.OS === 'android' && isSimulator) {
      return 'http://10.0.2.2:5000/api/v1';
    }
  }

  // iOS Simulator (Mac) + Expo web on same machine — backend on this PC
  return 'http://localhost:5000/api/v1';
}

export const API_BASE = resolveApiBase();

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

/**
 * Lightweight check that a saved session token is still accepted by the backend.
 * Used on app startup (in the splash screen) so an expired token routes the
 * parent back to the phone-lookup screen instead of dumping them on a dashboard
 * that 401s with an "unauthenticated" error.
 *
 * Returns one of:
 *   'valid'   – backend accepted the token (2xx)
 *   'invalid' – backend rejected the token (401/403) → must re-authenticate
 *   'unknown' – couldn't reach the backend / timeout / server error
 *               → caller should KEEP the session (likely just offline)
 *
 * @param {string} studentId - selected student's id (the token is checked against this)
 * @param {string} token     - JWT from AuthContext
 */
export async function verifySession(studentId, token, { timeoutMs = 6000 } = {}) {
  if (!token || !studentId) return 'invalid';

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${API_BASE}/portal/child/${studentId}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
    });

    if (res.ok) return 'valid';
    if (res.status === 401 || res.status === 403) return 'invalid';
    // 404 / 5xx / anything else — don't sign the user out over a server hiccup
    return 'unknown';
  } catch {
    // Network failure or timeout — keep the user signed in (they may be offline)
    return 'unknown';
  } finally {
    clearTimeout(timer);
  }
}
