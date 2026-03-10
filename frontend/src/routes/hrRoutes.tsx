import React, { lazy } from 'react';
import { Route } from 'react-router-dom';

// Employees
const EmployeeListPage = lazy(() => import('@/modules/hr/EmployeeListPage'));
const EmployeeDetailPage = lazy(() => import('@/modules/hr/EmployeeDetailPage'));
const EmployeeFormPage = lazy(() => import('@/modules/hr/EmployeeFormPage'));
const TimesheetListPage = lazy(() => import('@/modules/hr/TimesheetListPage'));
const CrewPage = lazy(() => import('@/modules/hr/CrewPage'));
const CrewTimeCalendarPage = lazy(() => import('@/modules/hr/CrewTimeCalendarPage'));
const TimesheetPivotPage = lazy(() => import('@/modules/hr/TimesheetPivotPage'));
const CrewTimeSheetsPage = lazy(() => import('@/modules/hr/CrewTimeSheetsPage'));
const CrewTimeEntriesPage = lazy(() => import('@/modules/hr/CrewTimeEntriesPage'));

// HR Advanced
const StaffingSchedulePage = lazy(() => import('@/modules/hr/StaffingSchedulePage'));
const TimesheetT13Page = lazy(() => import('@/modules/hr/TimesheetT13Page'));
const WorkOrderFormPage = lazy(() => import('@/modules/hr/WorkOrderFormPage'));
const QualificationsJournalPage = lazy(() => import('@/modules/hr/QualificationsJournalPage'));
const SeniorityLeavePage = lazy(() => import('@/modules/hr/SeniorityLeavePage'));

// Safety
const SafetyPage = lazy(() => import('@/modules/safety/SafetyDashboardPage'));
const SafetyIncidentFormPage = lazy(() => import('@/modules/safety/SafetyIncidentFormPage'));
const SafetyBoardPage = lazy(() => import('@/modules/safety/SafetyBoardPage'));
const SafetyMetricsDashboard = lazy(() => import('@/modules/safety/SafetyMetricsDashboard'));
const SafetyTrainingJournalPage = lazy(() => import('@/modules/safety/SafetyTrainingJournalPage'));
const PpeManagementPage = lazy(() => import('@/modules/safety/PpeManagementPage'));
const SoutCardPage = lazy(() => import('@/modules/safety/SoutCardPage'));
const AccidentActN1Page = lazy(() => import('@/modules/safety/AccidentActN1Page'));

// HR Russian
const EmploymentContractListPage = lazy(() => import('@/modules/hrRussian/EmploymentContractListPage'));
const PersonnelOrderListPage = lazy(() => import('@/modules/hrRussian/PersonnelOrderListPage'));
const StaffingTablePage = lazy(() => import('@/modules/hrRussian/StaffingTablePage'));
const TimeSheetPage = lazy(() => import('@/modules/hrRussian/TimeSheetPage'));

// Recruitment
const ApplicantListPage = lazy(() => import('@/modules/recruitment/ApplicantListPage'));
const ApplicantDetailPage = lazy(() => import('@/modules/recruitment/ApplicantDetailPage'));
const ApplicantFormPage = lazy(() => import('@/modules/recruitment/ApplicantFormPage'));
const JobPositionListPage = lazy(() => import('@/modules/recruitment/JobPositionListPage'));
const ApplicantBoardPage = lazy(() => import('@/modules/recruitment/ApplicantBoardPage'));

// Leave
const LeaveRequestListPage = lazy(() => import('@/modules/leave/LeaveRequestListPage'));
const LeaveAllocationPage = lazy(() => import('@/modules/leave/LeaveAllocationPage'));
const LeaveTypesPage = lazy(() => import('@/modules/leave/LeaveTypesPage'));
const LeaveBoardPage = lazy(() => import('@/modules/leave/LeaveBoardPage'));

// HR — additional
const CertificationMatrixPage = lazy(() => import('@/modules/hr/CertificationMatrixPage'));
const TimesheetDetailPage = lazy(() => import('@/modules/hr/TimesheetDetailPage'));

// Safety — additional
const SafetyCertificationMatrixPage = lazy(() => import('@/modules/safety/CertificationMatrixPage'));
const SafetyBriefingListPage = lazy(() => import('@/modules/safety/SafetyBriefingListPage'));
const SafetyBriefingDetailPage = lazy(() => import('@/modules/safety/SafetyBriefingDetailPage'));
const SafetyBriefingFormPage = lazy(() => import('@/modules/safety/SafetyBriefingFormPage'));
const SafetyComplianceDashboardPage = lazy(() => import('@/modules/safety/SafetyComplianceDashboardPage'));
const SafetyIncidentListPage = lazy(() => import('@/modules/safety/SafetyIncidentListPage'));
const SafetyIncidentDetailPage = lazy(() => import('@/modules/safety/SafetyIncidentDetailPage'));
const SafetyInspectionListPage = lazy(() => import('@/modules/safety/SafetyInspectionListPage'));
const SafetyInspectionDetailPage = lazy(() => import('@/modules/safety/SafetyInspectionDetailPage'));
const SafetyInspectionFormPage = lazy(() => import('@/modules/safety/SafetyInspectionFormPage'));
const SafetyTrainingListPage = lazy(() => import('@/modules/safety/SafetyTrainingListPage'));
const SafetyTrainingDetailPage = lazy(() => import('@/modules/safety/SafetyTrainingDetailPage'));
const SafetyTrainingFormPage = lazy(() => import('@/modules/safety/SafetyTrainingFormPage'));
const SafetyViolationListPage = lazy(() => import('@/modules/safety/SafetyViolationListPage'));
const WorkerCertsPage = lazy(() => import('@/modules/safety/WorkerCertsPage'));

export function hrRoutes() {
  return (
    <>
      {/* Employees */}
      <Route path="employees" element={<EmployeeListPage />} />
      <Route path="employees/new" element={<EmployeeFormPage />} />
      <Route path="employees/:id" element={<EmployeeDetailPage />} />
      <Route path="employees/:id/edit" element={<EmployeeFormPage />} />
      <Route path="crew" element={<CrewPage />} />
      <Route path="timesheets" element={<TimesheetListPage />} />

      {/* Safety */}
      <Route path="safety" element={<SafetyPage />} />
      <Route path="safety/board" element={<SafetyBoardPage />} />
      <Route path="safety/incidents/new" element={<SafetyIncidentFormPage />} />
      <Route path="safety/incidents/:id/edit" element={<SafetyIncidentFormPage />} />
      <Route path="safety/metrics" element={<SafetyMetricsDashboard />} />
      <Route path="safety/training-journal" element={<SafetyTrainingJournalPage />} />
      <Route path="safety/ppe" element={<PpeManagementPage />} />
      <Route path="safety/sout" element={<SoutCardPage />} />
      <Route path="safety/accident-acts" element={<AccidentActN1Page />} />

      {/* HR Russian */}
      <Route path="hr-russian/employment-contracts" element={<EmploymentContractListPage />} />
      <Route path="hr-russian/personnel-orders" element={<PersonnelOrderListPage />} />
      <Route path="hr-russian/staffing" element={<StaffingTablePage />} />
      <Route path="hr-russian/timesheets" element={<TimeSheetPage />} />

      {/* Recruitment */}
      <Route path="recruitment/applicants" element={<ApplicantListPage />} />
      <Route path="recruitment/applicants/new" element={<ApplicantFormPage />} />
      <Route path="recruitment/applicants/board" element={<ApplicantBoardPage />} />
      <Route path="recruitment/applicants/:id" element={<ApplicantDetailPage />} />
      <Route path="recruitment/applicants/:id/edit" element={<ApplicantFormPage />} />
      <Route path="recruitment/jobs" element={<JobPositionListPage />} />

      {/* Leave */}
      <Route path="leave/requests" element={<LeaveRequestListPage />} />
      <Route path="leave/board" element={<LeaveBoardPage />} />
      <Route path="leave/allocations" element={<LeaveAllocationPage />} />
      <Route path="leave/types" element={<LeaveTypesPage />} />

      {/* Crew Time */}
      <Route path="hr/crew-timesheets" element={<CrewTimeSheetsPage />} />
      <Route path="hr/crew-time-entries" element={<CrewTimeEntriesPage />} />
      <Route path="hr/crew-time-calendar" element={<CrewTimeCalendarPage />} />
      <Route path="hr/timesheet-pivot" element={<TimesheetPivotPage />} />

      {/* HR Advanced */}
      <Route path="hr/staffing-schedule" element={<StaffingSchedulePage />} />
      <Route path="hr/timesheet-t13" element={<TimesheetT13Page />} />
      <Route path="hr/work-orders" element={<WorkOrderFormPage />} />
      <Route path="hr/qualifications" element={<QualificationsJournalPage />} />
      <Route path="hr/seniority-leave" element={<SeniorityLeavePage />} />

      {/* HR — additional */}
      <Route path="hr/certification-matrix" element={<CertificationMatrixPage />} />
      <Route path="timesheets/:id" element={<TimesheetDetailPage />} />

      {/* Safety — additional */}
      <Route path="safety/certification-matrix" element={<SafetyCertificationMatrixPage />} />
      <Route path="safety/briefings" element={<SafetyBriefingListPage />} />
      <Route path="safety/briefings/new" element={<SafetyBriefingFormPage />} />
      <Route path="safety/briefings/:id" element={<SafetyBriefingDetailPage />} />
      <Route path="safety/briefings/:id/edit" element={<SafetyBriefingFormPage />} />
      <Route path="safety/compliance" element={<SafetyComplianceDashboardPage />} />
      <Route path="safety/incidents" element={<SafetyIncidentListPage />} />
      <Route path="safety/incidents/:id" element={<SafetyIncidentDetailPage />} />
      <Route path="safety/inspections" element={<SafetyInspectionListPage />} />
      <Route path="safety/inspections/new" element={<SafetyInspectionFormPage />} />
      <Route path="safety/inspections/:id" element={<SafetyInspectionDetailPage />} />
      <Route path="safety/inspections/:id/edit" element={<SafetyInspectionFormPage />} />
      <Route path="safety/training" element={<SafetyTrainingListPage />} />
      <Route path="safety/training/new" element={<SafetyTrainingFormPage />} />
      <Route path="safety/training/:id" element={<SafetyTrainingDetailPage />} />
      <Route path="safety/training/:id/edit" element={<SafetyTrainingFormPage />} />
      <Route path="safety/violations" element={<SafetyViolationListPage />} />
      <Route path="safety/worker-certs" element={<WorkerCertsPage />} />
    </>
  );
}
