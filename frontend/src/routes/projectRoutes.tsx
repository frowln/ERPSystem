import React, { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';

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

// Estimates
const EstimateListPage = lazy(() => import('@/modules/estimates/EstimateListPage'));
const EstimateDetailPage = lazy(() => import('@/modules/estimates/EstimateDetailPage'));
const EstimateFormPage = lazy(() => import('@/modules/estimates/EstimateFormPage'));
const EstimatePivotPage = lazy(() => import('@/modules/estimates/EstimatePivotPage'));
const EstimateNormativeView = lazy(() => import('@/modules/estimates/EstimateNormativeView'));
const EstimateFmReconciliation = lazy(() => import('@/modules/estimates/EstimateFmReconciliation'));

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

// Planning
const WbsTreePage = lazy(() => import('@/modules/planning/WbsTreePage'));
const ScheduleBaselinePage = lazy(() => import('@/modules/planning/ScheduleBaselinePage'));
const GanttChartPage = lazy(() => import('@/modules/planning/GanttChartPage'));
const ResourceAllocationPage = lazy(() => import('@/modules/planning/ResourceAllocationPage'));
const EvmDashboardPage = lazy(() => import('@/modules/planning/EvmDashboardPage'));

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

// Design
const DesignVersionListPage = lazy(() => import('@/modules/design/DesignVersionListPage'));
const DesignVersionFormPage = lazy(() => import('@/modules/design/DesignVersionFormPage'));
const DesignReviewPage = lazy(() => import('@/modules/design/DesignReviewPage'));
const DesignSectionListPage = lazy(() => import('@/modules/design/DesignSectionListPage'));
const DesignReviewBoardPage = lazy(() => import('@/modules/design/DesignReviewBoardPage'));

export function projectRoutes() {
  return (
    <>
      {/* Projects */}
      <Route path="projects" element={<ProjectListPage />} />
      <Route path="projects/new" element={<ProjectFormPage />} />
      <Route path="projects/:id" element={<ProjectDetailPage />} />
      <Route path="projects/:id/edit" element={<ProjectFormPage />} />

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

      {/* Specifications */}
      <Route path="specifications" element={<SpecificationListPage />} />
      <Route path="specifications/new" element={<SpecificationFormPage />} />
      <Route path="specifications/:id" element={<SpecificationDetailPage />} />
      <Route path="specifications/:id/edit" element={<SpecificationFormPage />} />
      <Route path="specifications/:specId/competitive-list/:id" element={<CompetitiveListPage />} />
      <Route path="specifications/:id/split" element={<SpecificationSplitView />} />
      <Route path="specifications/:id/supply-dashboard" element={<SpecSupplyDashboard />} />
      <Route path="specifications/analogs" element={<MaterialAnalogsPage />} />
      <Route path="specifications/analog-requests" element={<AnalogRequestsPage />} />

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
