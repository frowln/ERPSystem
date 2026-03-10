import React from 'react';
import { AppRoutes } from '@/routes';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import CookieConsent from '@/components/CookieConsent';

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppRoutes />
      <CookieConsent />
    </ErrorBoundary>
  );
};
