import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../config/api';

export function useBooksData() {
  const { token, student } = useAuth();
  const studentId = student?.studentId;

  return useQuery({
    queryKey: ['portal-books', studentId],
    queryFn: () => apiFetch(`/portal/child/${studentId}/books`, token),
    enabled: !!token && !!studentId,
    staleTime: 5 * 60 * 1000,
  });
}
