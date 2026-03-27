import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../config/api';

/**
 * Shared hook for all portal screens.
 * React Query caches the result so only one network request is made
 * across all screens that use this hook.
 */
export function usePortalData() {
  const { token, student } = useAuth();

  return useQuery({
    queryKey: ['portal', student?.studentId],
    queryFn: () => apiFetch(`/portal/child/${student?.studentId}`, token),
    enabled: !!token && !!student?.studentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

/** Derive an overall letter grade from an average score */
export function scoreToGrade(avg) {
  if (avg == null) return '—';
  if (avg >= 80) return 'A1';
  if (avg >= 75) return 'B2';
  if (avg >= 70) return 'B3';
  if (avg >= 65) return 'C4';
  if (avg >= 60) return 'C5';
  if (avg >= 55) return 'C6';
  if (avg >= 50) return 'D7';
  if (avg >= 45) return 'E8';
  return 'F9';
}

/** Average of an array of numbers (ignoring nulls) */
export function average(nums) {
  const valid = nums.filter((n) => n != null);
  if (!valid.length) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}
