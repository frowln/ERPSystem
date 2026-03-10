import React, { lazy } from 'react';
import { Route } from 'react-router-dom';

const MailPage = lazy(() => import('@/modules/email/MailPage'));

export function emailRoutes() {
  return (
    <Route path="mail" element={<MailPage />} />
  );
}
