import React, { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';

// Quality
const QualityListPage = lazy(() => import('@/modules/quality/QualityListPage'));
const QualityCheckDetailPage = lazy(() => import('@/modules/quality/QualityCheckDetailPage'));
const QualityBoardPage = lazy(() => import('@/modules/quality/QualityBoardPage'));
const InspectionFormPage = lazy(() => import('@/modules/quality/InspectionFormPage'));
const ToleranceRulesPage = lazy(() => import('@/modules/quality/ToleranceRulesPage'));
const ToleranceChecksPage = lazy(() => import('@/modules/quality/ToleranceChecksPage'));
const MaterialCertificatesPage = lazy(() => import('@/modules/quality/MaterialCertificatesPage'));
const MaterialInspectionPage = lazy(() => import('@/modules/quality/MaterialInspectionPage'));
const ChecklistTemplatesPage = lazy(() => import('@/modules/quality/ChecklistTemplatesPage'));
const DefectRegisterPage = lazy(() => import('@/modules/quality/DefectRegisterPage'));
const DefectParetoPage = lazy(() => import('@/modules/quality/DefectParetoPage'));
const AuthorSupervisionJournalPage = lazy(() => import('@/modules/quality/AuthorSupervisionJournalPage'));

// Punchlist
const PunchlistItemsPage = lazy(() => import('@/modules/punchlist/PunchlistItemsPage'));
const PunchlistItemDetailPage = lazy(() => import('@/modules/punchlist/PunchlistItemDetailPage'));
const PunchlistDashboardPage = lazy(() => import('@/modules/punchlist/PunchlistDashboardPage'));
const PunchlistBoardPage = lazy(() => import('@/modules/punchlist/PunchlistBoardPage'));
const PunchListItemFormPage = lazy(() => import('@/modules/punchlist/PunchListItemFormPage'));

// Regulatory
const PermitsPage = lazy(() => import('@/modules/regulatory/PermitsPage'));
const PermitDetailPage = lazy(() => import('@/modules/regulatory/PermitDetailPage'));
const LicensesPage = lazy(() => import('@/modules/regulatory/LicensesPage'));
const InspectionsPage = lazy(() => import('@/modules/regulatory/InspectionsPage'));
const RegulatoryDashboardPage = lazy(() => import('@/modules/regulatory/RegulatoryDashboardPage'));
const PermitBoardPage = lazy(() => import('@/modules/regulatory/PermitBoardPage'));
const ReportingCalendarPage = lazy(() => import('@/modules/regulatory/ReportingCalendarPage'));
const PrescriptionsJournalPage = lazy(() => import('@/modules/regulatory/PrescriptionsJournalPage'));
const PrescriptionResponsePage = lazy(() => import('@/modules/regulatory/PrescriptionResponsePage'));
const SroLicenseRegistryPage = lazy(() => import('@/modules/regulatory/SroLicenseRegistryPage'));
const InspectionPrepPage = lazy(() => import('@/modules/regulatory/InspectionPrepPage'));
const InspectionHistoryPage = lazy(() => import('@/modules/regulatory/InspectionHistoryPage'));

export function qualityRoutes() {
  return (
    <>
      {/* Quality */}
      <Route path="quality" element={<QualityListPage />} />
      <Route path="quality/board" element={<QualityBoardPage />} />
      <Route path="quality/inspections/new" element={<InspectionFormPage />} />
      <Route path="quality/inspections/:id/edit" element={<InspectionFormPage />} />
      <Route path="quality/:id" element={<QualityCheckDetailPage />} />
      <Route path="quality/tolerance-rules" element={<ToleranceRulesPage />} />
      <Route path="quality/tolerance-checks" element={<ToleranceChecksPage />} />
      <Route path="quality/certificates" element={<MaterialCertificatesPage />} />
      <Route path="quality/material-inspection" element={<MaterialInspectionPage />} />
      <Route path="quality/checklist-templates" element={<ChecklistTemplatesPage />} />
      <Route path="quality/defect-register" element={<DefectRegisterPage />} />
      <Route path="quality/defect-pareto" element={<DefectParetoPage />} />
      <Route path="quality/supervision-journal" element={<AuthorSupervisionJournalPage />} />

      {/* Punchlist */}
      <Route path="punchlist/items" element={<PunchlistItemsPage />} />
      <Route path="punchlist/board" element={<PunchlistBoardPage />} />
      <Route path="punchlist/items/new" element={<PunchListItemFormPage />} />
      <Route path="punchlist/items/:id" element={<PunchlistItemDetailPage />} />
      <Route path="punchlist/items/:id/edit" element={<PunchListItemFormPage />} />
      <Route path="punchlist/dashboard" element={<PunchlistDashboardPage />} />
      <Route path="punchlist/new" element={<Navigate to="/punchlist/items" replace />} />

      {/* Regulatory */}
      <Route path="regulatory/permits" element={<PermitsPage />} />
      <Route path="regulatory/permits/board" element={<PermitBoardPage />} />
      <Route path="regulatory/permits/:id" element={<PermitDetailPage />} />
      <Route path="regulatory/licenses" element={<LicensesPage />} />
      <Route path="regulatory/inspections" element={<InspectionsPage />} />
      <Route path="regulatory/dashboard" element={<RegulatoryDashboardPage />} />
      <Route path="regulatory/reporting-calendar" element={<ReportingCalendarPage />} />
      <Route path="regulatory/prescriptions-journal" element={<PrescriptionsJournalPage />} />
      <Route path="regulatory/prescription-responses" element={<PrescriptionResponsePage />} />
      <Route path="regulatory/sro-licenses" element={<SroLicenseRegistryPage />} />
      <Route path="regulatory/inspection-prep" element={<InspectionPrepPage />} />
      <Route path="regulatory/inspection-history" element={<InspectionHistoryPage />} />
    </>
  );
}
