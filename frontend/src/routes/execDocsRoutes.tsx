import React, { lazy } from 'react';
import { Route } from 'react-router-dom';

const AosrPage = lazy(() => import('@/modules/execDocs/AosrPage'));
const Ks6JournalPage = lazy(() => import('@/modules/execDocs/Ks6JournalPage'));
const IncomingControlJournalPage = lazy(() => import('@/modules/execDocs/IncomingControlJournalPage'));
const WeldingJournalPage = lazy(() => import('@/modules/execDocs/WeldingJournalPage'));
const SpecialJournalsPage = lazy(() => import('@/modules/execDocs/SpecialJournalsPage'));

export function execDocsRoutes() {
  return (
    <>
      <Route path="exec-docs/aosr" element={<AosrPage />} />
      <Route path="exec-docs/ks6" element={<Ks6JournalPage />} />
      <Route path="exec-docs/incoming-control" element={<IncomingControlJournalPage />} />
      <Route path="exec-docs/welding" element={<WeldingJournalPage />} />
      <Route path="exec-docs/special-journals" element={<SpecialJournalsPage />} />
    </>
  );
}
