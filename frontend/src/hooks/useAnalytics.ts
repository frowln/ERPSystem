import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView, trackUser } from '@/lib/analytics';
import { useAuthStore } from '@/stores/authStore';

/**
 * Hook that tracks SPA page views on route changes
 * and identifies the authenticated user to Yandex Metrica.
 */
export function useAnalytics(): void {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const identifiedRef = useRef(false);

  // Track page views on route change
  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location.pathname, location.search]);

  // Identify the authenticated user (once per session)
  useEffect(() => {
    if (user?.id && !identifiedRef.current) {
      trackUser(String(user.id));
      identifiedRef.current = true;
    }
  }, [user?.id]);
}
