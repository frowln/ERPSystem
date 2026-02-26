import React, { lazy } from 'react';
import { Route } from 'react-router-dom';

// Existing closeout pages
const CloseoutDashboardPage = lazy(() => import('@/modules/closeout/CloseoutDashboardPage'));
const CommissioningListPage = lazy(() => import('@/modules/closeout/CommissioningListPage'));
const CommissioningBoardPage = lazy(() => import('@/modules/closeout/CommissioningBoardPage'));
const CommissioningDetailPage = lazy(() => import('@/modules/closeout/CommissioningDetailPage'));
const HandoverPackageListPage = lazy(() => import('@/modules/closeout/HandoverPackageListPage'));
const HandoverPackageDetailPage = lazy(() => import('@/modules/closeout/HandoverPackageDetailPage'));
const WarrantyClaimListPage = lazy(() => import('@/modules/closeout/WarrantyClaimListPage'));
const WarrantyClaimDetailPage = lazy(() => import('@/modules/closeout/WarrantyClaimDetailPage'));
const AsBuiltTrackerPage = lazy(() => import('@/modules/closeout/AsBuiltTrackerPage'));
const CommissioningTemplateListPage = lazy(() => import('@/modules/closeout/CommissioningTemplateListPage'));
const WarrantyObligationListPage = lazy(() => import('@/modules/closeout/WarrantyObligationListPage'));
const ZosDocumentListPage = lazy(() => import('@/modules/closeout/ZosDocumentListPage'));

// New closeout pages
const CommissioningChecklistPage = lazy(() => import('@/modules/closeout/CommissioningChecklistPage'));
const ZosFormPage = lazy(() => import('@/modules/closeout/ZosFormPage'));
const StroyNadzorPackagePage = lazy(() => import('@/modules/closeout/StroyNadzorPackagePage'));
const WarrantyTrackingPage = lazy(() => import('@/modules/closeout/WarrantyTrackingPage'));
const ExecutiveSchemasPage = lazy(() => import('@/modules/closeout/ExecutiveSchemasPage'));

export function closeoutRoutes() {
  return (
    <>
      {/* Closeout Dashboard */}
      <Route path="closeout/dashboard" element={<CloseoutDashboardPage />} />

      {/* Commissioning */}
      <Route path="closeout/commissioning" element={<CommissioningListPage />} />
      <Route path="closeout/commissioning/board" element={<CommissioningBoardPage />} />
      <Route path="closeout/commissioning/:id" element={<CommissioningDetailPage />} />
      <Route path="closeout/commissioning-templates" element={<CommissioningTemplateListPage />} />

      {/* Handover */}
      <Route path="closeout/handover" element={<HandoverPackageListPage />} />
      <Route path="closeout/handover/:id" element={<HandoverPackageDetailPage />} />

      {/* Warranty */}
      <Route path="closeout/warranty" element={<WarrantyClaimListPage />} />
      <Route path="closeout/warranty/:id" element={<WarrantyClaimDetailPage />} />
      <Route path="closeout/warranty-obligations" element={<WarrantyObligationListPage />} />

      {/* As-Built */}
      <Route path="closeout/as-built" element={<AsBuiltTrackerPage />} />

      {/* ZOS */}
      <Route path="closeout/zos" element={<ZosDocumentListPage />} />

      {/* --- New pages --- */}
      <Route path="closeout/commissioning-checklist" element={<CommissioningChecklistPage />} />
      <Route path="closeout/zos-form" element={<ZosFormPage />} />
      <Route path="closeout/stroynadzor" element={<StroyNadzorPackagePage />} />
      <Route path="closeout/warranty-tracking" element={<WarrantyTrackingPage />} />
      <Route path="closeout/executive-schemas" element={<ExecutiveSchemasPage />} />
    </>
  );
}
