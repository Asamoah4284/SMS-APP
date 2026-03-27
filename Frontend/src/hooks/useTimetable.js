import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../config/api';

/**
 * Fetch the student's class timetable
 * Uses the parent-accessible /student/:classId endpoint
 */
export function useTimetable() {
  const { token, student } = useAuth();

  return useQuery({
    queryKey: ['timetable', student?.studentId],
    queryFn: () => apiFetch(`/timetable/child/${student?.studentId}`, token),
    enabled: !!token && !!student?.studentId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
}
