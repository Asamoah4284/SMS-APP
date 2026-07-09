import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../config/api';

export function useAnnouncements() {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['announcements', token],
    queryFn: () => apiFetch('/portal/announcements', token),
    enabled: !!token,
    staleTime: 60_000,
  });
}

export function formatAnnouncementDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}
