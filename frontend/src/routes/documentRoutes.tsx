import React, { lazy } from 'react';
import { Route } from 'react-router-dom';

// CDE
const DocumentContainerListPage = lazy(() => import('@/modules/cde/DocumentContainerListPage'));
const DocumentContainerDetailPage = lazy(() => import('@/modules/cde/DocumentContainerDetailPage'));
const TransmittalListPage = lazy(() => import('@/modules/cde/TransmittalListPage'));
const TransmittalDetailPage = lazy(() => import('@/modules/cde/TransmittalDetailPage'));

// Russian Docs
const RussianDocListPage = lazy(() => import('@/modules/russianDocs/RussianDocListPage'));
const DocumentCreatePage = lazy(() => import('@/modules/russianDocs/DocumentCreatePage'));
const DocumentDetailPage = lazy(() => import('@/modules/russianDocs/DocumentDetailPage'));
const Ks2GeneratorPage = lazy(() => import('@/modules/russianDocs/Ks2GeneratorPage'));
const Ks3GeneratorPage = lazy(() => import('@/modules/russianDocs/Ks3GeneratorPage'));
const SbisDocumentsPage = lazy(() => import('@/modules/russianDocs/SbisDocumentsPage'));
const EdoDocumentsPage = lazy(() => import('@/modules/russianDocs/EdoDocumentsPage'));

// Data Exchange
const DataImportPage = lazy(() => import('@/modules/dataExchange/ImportJobListPage'));
const DataExportPage = lazy(() => import('@/modules/dataExchange/ExportJobListPage'));
const DataMappingPage = lazy(() => import('@/modules/dataExchange/MappingConfigPage'));
const OneCConfigPage = lazy(() => import('@/modules/dataExchange/OneCConfigPage'));
const OneCExchangeLogPage = lazy(() => import('@/modules/dataExchange/OneCExchangeLogPage'));

// PTO
const PtoDocumentListPage = lazy(() => import('@/modules/pto/PtoDocumentListPage'));
const PtoDocumentDetailPage = lazy(() => import('@/modules/pto/PtoDocumentDetailPage'));
const PtoDocumentFormPage = lazy(() => import('@/modules/pto/PtoDocumentFormPage'));
const WorkPermitListPage = lazy(() => import('@/modules/pto/WorkPermitListPage'));
const LabTestListPage = lazy(() => import('@/modules/pto/LabTestListPage'));
const Ks6CalendarPage = lazy(() => import('@/modules/pto/Ks6CalendarPage'));
const PtoDocumentBoardPage = lazy(() => import('@/modules/pto/PtoDocumentBoardPage'));

// Closing documents / Site
const Ks2ListPage = lazy(() => import('@/modules/closing/Ks2ListPage'));
const Ks2DetailPage = lazy(() => import('@/modules/closing/Ks2DetailPage'));
const Ks3ListPage = lazy(() => import('@/modules/closing/Ks3ListPage'));
const Ks2ApprovalWorkflowPage = lazy(() => import('@/modules/closing/Ks2ApprovalWorkflowPage'));
const Ks2VolumeCheckPage = lazy(() => import('@/modules/closing/Ks2VolumeCheckPage'));
const Ks6aJournalPage = lazy(() => import('@/modules/closing/Ks6aJournalPage'));
const CorrectionActsPage = lazy(() => import('@/modules/closing/CorrectionActsPage'));
const KsPrintFormsPage = lazy(() => import('@/modules/closing/KsPrintFormsPage'));
const M29ListPage = lazy(() => import('@/modules/russianDocs/M29ListPage'));
const DailyLogPage = lazy(() => import('@/modules/dailylog/DailyLogPage'));
const DailyLogFormPage = lazy(() => import('@/modules/dailylog/DailyLogFormPage'));
const DailyLogBoardPage = lazy(() => import('@/modules/dailylog/DailyLogBoardPage'));

export function documentRoutes() {
  return (
    <>
      {/* CDE */}
      <Route path="cde/documents" element={<DocumentContainerListPage />} />
      <Route path="cde/documents/:id" element={<DocumentContainerDetailPage />} />
      <Route path="cde/transmittals" element={<TransmittalListPage />} />
      <Route path="cde/transmittals/:id" element={<TransmittalDetailPage />} />

      {/* Russian Docs */}
      <Route path="russian-docs/list" element={<RussianDocListPage />} />
      <Route path="russian-docs/create" element={<DocumentCreatePage />} />
      <Route path="russian-docs/ks2" element={<Ks2GeneratorPage />} />
      <Route path="russian-docs/ks3" element={<Ks3GeneratorPage />} />
      <Route path="russian-docs/:id" element={<DocumentDetailPage />} />
      <Route path="russian-docs/sbis" element={<SbisDocumentsPage />} />
      <Route path="russian-docs/edo" element={<EdoDocumentsPage />} />

      {/* Data Exchange */}
      <Route path="data-exchange/import" element={<DataImportPage />} />
      <Route path="data-exchange/export" element={<DataExportPage />} />
      <Route path="data-exchange/mapping" element={<DataMappingPage />} />
      <Route path="data-exchange/1c-config" element={<OneCConfigPage />} />
      <Route path="data-exchange/1c-logs" element={<OneCExchangeLogPage />} />

      {/* PTO */}
      <Route path="pto/documents" element={<PtoDocumentListPage />} />
      <Route path="pto/documents/board" element={<PtoDocumentBoardPage />} />
      <Route path="pto/documents/new" element={<PtoDocumentFormPage />} />
      <Route path="pto/documents/:id" element={<PtoDocumentDetailPage />} />
      <Route path="pto/documents/:id/edit" element={<PtoDocumentFormPage />} />
      <Route path="pto/work-permits" element={<WorkPermitListPage />} />
      <Route path="pto/lab-tests" element={<LabTestListPage />} />
      <Route path="pto/ks6-calendar" element={<Ks6CalendarPage />} />

      {/* Closing documents / Site docs */}
      <Route path="daily-log" element={<DailyLogPage />} />
      <Route path="daily-log/board" element={<DailyLogBoardPage />} />
      <Route path="daily-logs/new" element={<DailyLogFormPage />} />
      <Route path="daily-logs/:id/edit" element={<DailyLogFormPage />} />
      <Route path="ks2" element={<Ks2ListPage />} />
      <Route path="ks2/:id" element={<Ks2DetailPage />} />
      <Route path="ks2/approvals" element={<Ks2ApprovalWorkflowPage />} />
      <Route path="ks2/volume-check" element={<Ks2VolumeCheckPage />} />
      <Route path="ks3" element={<Ks3ListPage />} />
      <Route path="ks6a" element={<Ks6aJournalPage />} />
      <Route path="correction-acts" element={<CorrectionActsPage />} />
      <Route path="ks-print" element={<KsPrintFormsPage />} />
      <Route path="m29" element={<M29ListPage />} />
    </>
  );
}
