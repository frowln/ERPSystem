import React, { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';

// Projects
const ProjectListPage = lazy(() => import('@/modules/projects/ProjectListPage'));
const ProjectDetailPage = lazy(() => import('@/modules/projects/ProjectDetailPage'));
const ProjectFormPage = lazy(() => import('@/modules/projects/ProjectFormPage'));

// Tasks
const TaskBoardPage = lazy(() => import('@/pages/TaskBoardPage'));
const TaskListPage = lazy(() => import('@/pages/TaskListPage'));
const GanttPage = lazy(() => import('@/pages/GanttPage'));

// Calendar
const CalendarPage = lazy(() => import('@/modules/calendar/CalendarPage'));
const CalendarEventFormPage = lazy(() => import('@/modules/calendar/CalendarEventFormPage'));

// Documents
const DocumentListPage = lazy(() => import('@/modules/documents/DocumentListPage'));
const DocumentFormPage = lazy(() => import('@/modules/documents/DocumentFormPage'));

// Contracts
const ContractListPage = lazy(() => import('@/modules/contracts/ContractListPage'));
const ContractDetailPage = lazy(() => import('@/modules/contracts/ContractDetailPage'));
const ContractFormPage = lazy(() => import('@/modules/contracts/ContractFormPage'));
const ContractBoardPage = lazy(() => import('@/modules/contracts/ContractBoardPage'));

// Counterparties
const CounterpartyListPage = lazy(() => import('@/modules/counterparties/CounterpartyListPage'));
const CounterpartyFormPage = lazy(() => import('@/modules/counterparties/CounterpartyFormPage'));

// Estimates
const EstimateListPage = lazy(() => import('@/modules/estimates/EstimateListPage'));
const EstimateDetailPage = lazy(() => import('@/modules/estimates/EstimateDetailPage'));
const EstimateFormPage = lazy(() => import('@/modules/estimates/EstimateFormPage'));
const EstimatePivotPage = lazy(() => import('@/modules/estimates/EstimatePivotPage'));
const EstimateNormativeView = lazy(() => import('@/modules/estimates/EstimateNormativeView'));
const EstimateFmReconciliation = lazy(() => import('@/modules/estimates/EstimateFmReconciliation'));
const EstimateImportPage = lazy(() => import('@/modules/estimates/EstimateImportPage'));
const EstimateExportPage = lazy(() => import('@/modules/estimates/EstimateExportPage'));
const VolumeCalculatorPage = lazy(() => import('@/modules/estimates/VolumeCalculatorPage'));
const EstimateComparisonPage = lazy(() => import('@/modules/estimates/EstimateComparisonPage'));
const MinstroyIndexPage = lazy(() => import('@/modules/estimates/MinstroyIndexPage'));
const SummaryEstimatePage = lazy(() => import('@/modules/estimates/SummaryEstimatePage'));
const PricingDatabaseListPage = lazy(() => import('@/modules/pricing/PricingDatabaseListPage'));
const PricingRatesPage = lazy(() => import('@/modules/pricing/PricingRatesPage'));
const PricingCalculatorPage = lazy(() => import('@/modules/pricing/PricingCalculatorPage'));

// Specifications
const SpecificationListPage = lazy(() => import('@/modules/specifications/SpecificationListPage'));
const SpecificationDetailPage = lazy(() => import('@/modules/specifications/SpecificationDetailPage'));
const SpecificationFormPage = lazy(() => import('@/modules/specifications/SpecificationFormPage'));
const CompetitiveListPage = lazy(() => import('@/modules/specifications/CompetitiveListPage'));
const MaterialAnalogsPage = lazy(() => import('@/modules/specifications/MaterialAnalogsPage'));
const AnalogRequestsPage = lazy(() => import('@/modules/specifications/AnalogRequestsPage'));
const SpecificationSplitView = lazy(() => import('@/modules/specifications/SpecificationSplitView'));
const SpecSupplyDashboard = lazy(() => import('@/modules/specifications/SpecSupplyDashboard'));

// RFI
const RfiListPage = lazy(() => import('@/modules/rfi/RfiListPage'));
const RfiDetailPage = lazy(() => import('@/modules/rfi/RfiDetailPage'));
const RfiFormPage = lazy(() => import('@/modules/rfi/RfiFormPage'));
const RfiBoardPage = lazy(() => import('@/modules/rfi/RfiBoardPage'));

// Submittals
const SubmittalListPage = lazy(() => import('@/modules/submittals/SubmittalListPage'));
const SubmittalDetailPage = lazy(() => import('@/modules/submittals/SubmittalDetailPage'));
const SubmittalFormPage = lazy(() => import('@/modules/submittals/SubmittalFormPage'));

// Issues
const IssueListPage = lazy(() => import('@/modules/issues/IssueListPage'));
const IssueDetailPage = lazy(() => import('@/modules/issues/IssueDetailPage'));
const IssueFormPage = lazy(() => import('@/modules/issues/IssueFormPage'));

// Change Management
const ChangeEventListPage = lazy(() => import('@/modules/changeManagement/ChangeEventListPage'));
const ChangeEventDetailPage = lazy(() => import('@/modules/changeManagement/ChangeEventDetailPage'));
const ChangeOrderListPage = lazy(() => import('@/modules/changeManagement/ChangeOrderListPage'));
const ChangeOrderDetailPage = lazy(() => import('@/modules/changeManagement/ChangeOrderDetailPage'));
const ChangeOrderFormPage = lazy(() => import('@/modules/changeManagement/ChangeOrderFormPage'));
const ChangeOrderBoardPage = lazy(() => import('@/modules/changeManagement/ChangeOrderBoardPage'));

// Risk Register & Pre-Construction Meeting
const RiskRegisterPage = lazy(() => import('@/modules/projects/RiskRegisterPage'));
const PreConstructionMeetingPage = lazy(() => import('@/modules/projects/PreConstructionMeetingPage'));

// Planning
const WbsTreePage = lazy(() => import('@/modules/planning/WbsTreePage'));
const ScheduleBaselinePage = lazy(() => import('@/modules/planning/ScheduleBaselinePage'));
const GanttChartPage = lazy(() => import('@/modules/planning/GanttChartPage'));
const ResourceAllocationPage = lazy(() => import('@/modules/planning/ResourceAllocationPage'));
const EvmDashboardPage = lazy(() => import('@/modules/planning/EvmDashboardPage'));
const CriticalPathPage = lazy(() => import('@/modules/planning/CriticalPathPage'));
const EvmIndicatorsPage = lazy(() => import('@/modules/planning/EvmIndicatorsPage'));
const ResourcePlanningPage = lazy(() => import('@/modules/planning/ResourcePlanningPage'));
const BaselinesPage = lazy(() => import('@/modules/planning/BaselinesPage'));
const SCurvePage = lazy(() => import('@/modules/planning/SCurvePage'));
const ProcurementSchedulePage = lazy(() => import('@/modules/planning/ProcurementSchedulePage'));
const MobilizationSchedulePage = lazy(() => import('@/modules/planning/MobilizationSchedulePage'));

// Workflow
const WorkflowTemplateListPage = lazy(() => import('@/modules/workflow/WorkflowTemplateListPage'));
const WorkflowInstancePage = lazy(() => import('@/modules/workflow/WorkflowInstancePage'));
const WorkflowDesignerPage = lazy(() => import('@/modules/workflow/WorkflowDesignerPage'));

// Closeout
const CommissioningPage = lazy(() => import('@/modules/closeout/CommissioningListPage'));
const HandoverPage = lazy(() => import('@/modules/closeout/HandoverPackageListPage'));
const WarrantyPage = lazy(() => import('@/modules/closeout/WarrantyClaimListPage'));
const CloseoutDashboardPage = lazy(() => import('@/modules/closeout/CloseoutDashboardPage'));
const CommissioningBoardPage = lazy(() => import('@/modules/closeout/CommissioningBoardPage'));
const CommissioningDetailPage = lazy(() => import('@/modules/closeout/CommissioningDetailPage'));
const HandoverPackageDetailPage = lazy(() => import('@/modules/closeout/HandoverPackageDetailPage'));
const WarrantyClaimDetailPage = lazy(() => import('@/modules/closeout/WarrantyClaimDetailPage'));

// BIM
const BimModelListPage = lazy(() => import('@/modules/bim/BimModelListPage'));
const BimModelDetailPage = lazy(() => import('@/modules/bim/BimModelDetailPage'));
const DesignPackagePage = lazy(() => import('@/modules/bim/DesignPackagePage'));
const ClashDetectionPage = lazy(() => import('@/modules/bim/ClashDetectionPage'));
const ClashBoardPage = lazy(() => import('@/modules/bim/ClashBoardPage'));
const ClashDetectionResultsPage = lazy(() => import('@/modules/bim/ClashDetectionResultsPage'));
const DefectHeatmapPage = lazy(() => import('@/modules/bim/DefectHeatmapPage'));
const ConstructionProgressPage = lazy(() => import('@/modules/bim/ConstructionProgressPage'));
const PropertySetsPage = lazy(() => import('@/modules/bim/PropertySetsPage'));
const BcfIssuesPage = lazy(() => import('@/modules/bim/BcfIssuesPage'));

// Design
const DesignVersionListPage = lazy(() => import('@/modules/design/DesignVersionListPage'));
const DesignVersionFormPage = lazy(() => import('@/modules/design/DesignVersionFormPage'));
const DesignReviewPage = lazy(() => import('@/modules/design/DesignReviewPage'));
const DesignSectionListPage = lazy(() => import('@/modules/design/DesignSectionListPage'));
const DesignReviewBoardPage = lazy(() => import('@/modules/design/DesignReviewBoardPage'));

export function projectRoutes() {
  const PRICING_ROLES = ['ADMIN', 'ESTIMATOR', 'PROJECT_MANAGER'] as const;
  return (
    <>
      {/* Projects */}
      <Route path="projects" element={<ProjectListPage />} />
      <Route path="projects/new" element={<ProjectFormPage />} />
      <Route path="projects/:id" element={<ProjectDetailPage />} />
      <Route path="projects/:id/edit" element={<ProjectFormPage />} />
      <Route path="projects/:id/risks" element={<RiskRegisterPage />} />
      <Route path="projects/:id/meeting" element={<PreConstructionMeetingPage />} />

      {/* Tasks */}
      <Route path="tasks" element={<TaskBoardPage />} />
      <Route path="tasks/list" element={<TaskListPage />} />
      <Route path="tasks/gantt" element={<GanttPage />} />

      {/* Calendar */}
      <Route path="calendar" element={<CalendarPage />} />
      <Route path="calendar/events/new" element={<CalendarEventFormPage />} />
      <Route path="calendar/events/:id/edit" element={<CalendarEventFormPage />} />

      {/* Documents */}
      <Route path="documents" element={<DocumentListPage />} />
      <Route path="documents/new" element={<DocumentFormPage />} />
      <Route path="documents/:id/edit" element={<DocumentFormPage />} />

      {/* Counterparties */}
      <Route path="counterparties" element={<CounterpartyListPage />} />
      <Route path="counterparties/new" element={<CounterpartyFormPage />} />
      <Route path="counterparties/:id" element={<CounterpartyFormPage />} />
      <Route path="counterparties/:id/edit" element={<CounterpartyFormPage />} />

      {/* Contracts */}
      <Route path="contracts" element={<ContractListPage />} />
      <Route path="contracts/board" element={<ContractBoardPage />} />
      <Route path="contracts/new" element={<ContractFormPage />} />
      <Route path="contracts/:id" element={<ContractDetailPage />} />
      <Route path="contracts/:id/edit" element={<ContractFormPage />} />

      {/* Estimates */}
      <Route path="estimates" element={<EstimateListPage />} />
      <Route path="estimates/pivot" element={<EstimatePivotPage />} />
      <Route path="estimates/new" element={<EstimateFormPage />} />
      <Route path="estimates/:id" element={<EstimateDetailPage />} />
      <Route path="estimates/:id/edit" element={<EstimateFormPage />} />
      <Route path="estimates/:id/normative" element={<EstimateNormativeView />} />
      <Route path="estimates/:id/fm-reconciliation" element={<EstimateFmReconciliation />} />
      <Route path="estimates/import" element={<EstimateImportPage />} />
      <Route path="estimates/export" element={<EstimateExportPage />} />
      <Route path="estimates/volume-calculator" element={<VolumeCalculatorPage />} />
      <Route path="estimates/comparison" element={<EstimateComparisonPage />} />
      <Route path="estimates/minstroy" element={<MinstroyIndexPage />} />
      <Route path="estimates/summary" element={<SummaryEstimatePage />} />
      <Route
        path="estimates/pricing/databases"
        element={<ProtectedRoute requiredRoles={[...PRICING_ROLES]}><PricingDatabaseListPage /></ProtectedRoute>}
      />
      <Route
        path="estimates/pricing/rates"
        element={<ProtectedRoute requiredRoles={[...PRICING_ROLES]}><PricingRatesPage /></ProtectedRoute>}
      />
      <Route
        path="estimates/pricing/calculate"
        element={<ProtectedRoute requiredRoles={[...PRICING_ROLES]}><PricingCalculatorPage /></ProtectedRoute>}
      />

      {/* Specifications */}
      <Route path="specifications" element={<SpecificationListPage />} />
      <Route path="specifications/new" element={<SpecificationFormPage />} />
      <Route path="specifications/analogs" element={<MaterialAnalogsPage />} />
      <Route path="specifications/analog-requests" element={<AnalogRequestsPage />} />
      <Route path="specifications/:id/split" element={<SpecificationSplitView />} />
      <Route path="specifications/:id/supply-dashboard" element={<SpecSupplyDashboard />} />
      <Route path="specifications/:specId/competitive-list/:id" element={<CompetitiveListPage />} />
      <Route path="specifications/:id" element={<SpecificationDetailPage />} />
      <Route path="specifications/:id/edit" element={<SpecificationFormPage />} />

      {/* RFI */}
      <Route path="pm/rfis" element={<RfiListPage />} />
      <Route path="pm/rfis/board" element={<RfiBoardPage />} />
      <Route path="pm/rfis/new" element={<RfiFormPage />} />
      <Route path="pm/rfis/:id" element={<RfiDetailPage />} />
      <Route path="pm/rfis/:id/edit" element={<RfiFormPage />} />

      {/* Submittals */}
      <Route path="pm/submittals" element={<SubmittalListPage />} />
      <Route path="pm/submittals/new" element={<SubmittalFormPage />} />
      <Route path="pm/submittals/:id" element={<SubmittalDetailPage />} />
      <Route path="pm/submittals/:id/edit" element={<SubmittalFormPage />} />

      {/* Issues */}
      <Route path="pm/issues" element={<IssueListPage />} />
      <Route path="pm/issues/new" element={<IssueFormPage />} />
      <Route path="pm/issues/:id" element={<IssueDetailPage />} />
      <Route path="pm/issues/:id/edit" element={<IssueFormPage />} />

      {/* Change Management */}
      <Route path="change-management/events" element={<ChangeEventListPage />} />
      <Route path="change-management/events/:id" element={<ChangeEventDetailPage />} />
      <Route path="change-management/orders" element={<ChangeOrderListPage />} />
      <Route path="change-management/orders/board" element={<ChangeOrderBoardPage />} />
      <Route path="change-management/orders/new" element={<ChangeOrderFormPage />} />
      <Route path="change-management/orders/:id" element={<ChangeOrderDetailPage />} />
      <Route path="change-management/orders/:id/edit" element={<ChangeOrderFormPage />} />

      {/* Planning */}
      <Route path="planning/wbs" element={<WbsTreePage />} />
      <Route path="planning/gantt" element={<GanttChartPage />} />
      <Route path="planning/baseline" element={<ScheduleBaselinePage />} />
      <Route path="planning/resources" element={<ResourceAllocationPage />} />
      <Route path="planning/evm" element={<EvmDashboardPage />} />
      <Route path="planning/critical-path" element={<CriticalPathPage />} />
      <Route path="planning/evm-indicators" element={<EvmIndicatorsPage />} />
      <Route path="planning/resource-planning" element={<ResourcePlanningPage />} />
      <Route path="planning/baselines-mgmt" element={<BaselinesPage />} />
      <Route path="planning/s-curve" element={<SCurvePage />} />
      <Route path="projects/:projectId/procurement-schedule" element={<ProcurementSchedulePage />} />
      <Route path="projects/:projectId/mobilization" element={<MobilizationSchedulePage />} />

      {/* Workflow */}
      <Route path="workflow/templates" element={<WorkflowTemplateListPage />} />
      <Route path="workflow/instances" element={<WorkflowInstancePage />} />
      <Route path="workflow/designer" element={<WorkflowDesignerPage />} />
      <Route path="workflow/designer/:id" element={<WorkflowDesignerPage />} />
      <Route path="workflows" element={<Navigate to="/workflow/templates" replace />} />

      {/* Closeout */}
      <Route path="closeout/commissioning" element={<CommissioningPage />} />
      <Route path="closeout/commissioning/board" element={<CommissioningBoardPage />} />
      <Route path="closeout/commissioning/:id" element={<CommissioningDetailPage />} />
      <Route path="closeout/handover" element={<HandoverPage />} />
      <Route path="closeout/handover/:id" element={<HandoverPackageDetailPage />} />
      <Route path="closeout/warranty" element={<WarrantyPage />} />
      <Route path="closeout/warranty/:id" element={<WarrantyClaimDetailPage />} />
      <Route path="closeout/dashboard" element={<CloseoutDashboardPage />} />

      {/* BIM */}
      <Route path="bim/models" element={<BimModelListPage />} />
      <Route path="bim/models/:id" element={<BimModelDetailPage />} />
      <Route path="bim/design-packages" element={<DesignPackagePage />} />
      <Route path="bim/clash-detection" element={<ClashDetectionPage />} />
      <Route path="bim/clash-detection/board" element={<ClashBoardPage />} />
      <Route path="bim/clash-results" element={<ClashDetectionResultsPage />} />
      <Route path="bim/defect-heatmap" element={<DefectHeatmapPage />} />
      <Route path="bim/construction-progress" element={<ConstructionProgressPage />} />
      <Route path="bim/property-sets" element={<PropertySetsPage />} />
      <Route path="bim/bcf-issues" element={<BcfIssuesPage />} />

      {/* Design */}
      <Route path="design/versions" element={<DesignVersionListPage />} />
      <Route path="design/versions/new" element={<DesignVersionFormPage />} />
      <Route path="design/versions/:id/edit" element={<DesignVersionFormPage />} />
      <Route path="design/reviews" element={<DesignReviewPage />} />
      <Route path="design/reviews/board" element={<DesignReviewBoardPage />} />
      <Route path="design/sections" element={<DesignSectionListPage />} />
    </>
  );
}
