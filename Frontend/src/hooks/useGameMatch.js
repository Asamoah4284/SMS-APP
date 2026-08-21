import { useCallback, useEffect, useRef, useState } from 'react';
import { apiFetch } from '../config/api';

export function useGameMatch(matchId, token, studentId, { enabled = true } = {}) {
  const [match, setMatch] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const refresh = useCallback(async () => {
    if (!matchId || !token || !studentId) return null;
    const data = await apiFetch(`/portal/games/matches/${matchId}?studentId=${encodeURIComponent(studentId)}`, token);
    if (mounted.current) {
      setMatch(data.match);
      setError(null);
    }
    return data.match;
  }, [matchId, token, studentId]);

  useEffect(() => {
    if (!enabled || !matchId || !token || !studentId) return undefined;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await apiFetch(`/portal/games/matches/${matchId}?studentId=${encodeURIComponent(studentId)}`, token);
        if (!cancelled) setMatch(data.match);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    const timer = setInterval(async () => {
      try {
        const data = await apiFetch(`/portal/games/matches/${matchId}?studentId=${encodeURIComponent(studentId)}`, token);
        if (!cancelled) setMatch(data.match);
      } catch {
        // keep last good state while polling
      }
    }, 2000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [enabled, matchId, token, studentId]);

  const sendAction = useCallback(async (type, payload = {}) => {
    const data = await apiFetch(`/portal/games/matches/${matchId}/actions`, token, {
      method: 'POST',
      body: JSON.stringify({ studentId, type, payload }),
    });
    setMatch(data.match);
    return data.match;
  }, [matchId, token, studentId]);

  return { match, error, loading, refresh, sendAction, setMatch };
}
