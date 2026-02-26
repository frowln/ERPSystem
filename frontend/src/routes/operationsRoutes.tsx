import React, { lazy } from 'react';
import { Route } from 'react-router-dom';

// Operations
const OperationsDailyLogsPage = lazy(() => import('@/modules/operations/OperationsDailyLogsPage'));
const DailyLogCreatePage = lazy(() => import('@/modules/operations/DailyLogCreatePage'));
const DailyLogDetailPage = lazy(() => import('@/modules/operations/DailyLogDetailPage'));
const WorkOrdersPage = lazy(() => import('@/modules/operations/WorkOrdersPage'));
const WorkOrderDetailPage = lazy(() => import('@/modules/operations/WorkOrderDetailPage'));
const OperationsDashboardPage = lazy(() => import('@/modules/operations/OperationsDashboardPage'));
const DispatchCalendarPage = lazy(() => import('@/modules/operations/DispatchCalendarPage'));
const WorkOrderBoardPage = lazy(() => import('@/modules/operations/WorkOrderBoardPage'));

// Fleet
const FleetListPage = lazy(() => import('@/modules/fleet/FleetListPage'));
const FleetDetailPage = lazy(() => import('@/modules/fleet/FleetDetailPage'));
const MaintenancePage = lazy(() => import('@/modules/fleet/MaintenancePage'));
const FuelPage = lazy(() => import('@/modules/fleet/FuelPage'));
const FleetVehicleFormPage = lazy(() => import('@/modules/fleet/FleetVehicleFormPage'));
const FleetMaintenanceBoardPage = lazy(() => import('@/modules/fleet/FleetMaintenanceBoardPage'));
const WaybillsPage = lazy(() => import('@/modules/fleet/WaybillsPage'));
const FuelAccountingPage = lazy(() => import('@/modules/fleet/FuelAccountingPage'));
const MaintenanceToRepairPage = lazy(() => import('@/modules/fleet/MaintenanceToRepairPage'));
const GpsTrackingPage = lazy(() => import('@/modules/fleet/GpsTrackingPage'));
const DriverRatingPage = lazy(() => import('@/modules/fleet/DriverRatingPage'));

// IoT
const DevicesPage = lazy(() => import('@/modules/iot/DevicesPage'));
const DeviceDetailPage = lazy(() => import('@/modules/iot/DeviceDetailPage'));
const SensorsPage = lazy(() => import('@/modules/iot/SensorsPage'));
const AlertsPage = lazy(() => import('@/modules/iot/AlertsPage'));

// Maintenance
const MaintenanceRequestListPage = lazy(() => import('@/modules/maintenance/MaintenanceRequestListPage'));
const MaintenanceRequestFormPage = lazy(() => import('@/modules/maintenance/MaintenanceRequestFormPage'));
const EquipmentListPage = lazy(() => import('@/modules/maintenance/EquipmentListPage'));
const MaintenanceDashboardPage = lazy(() => import('@/modules/maintenance/MaintenanceDashboardPage'));
const MaintenanceBoardPage = lazy(() => import('@/modules/maintenance/MaintenanceBoardPage'));

// Dispatch
const DispatchOrderListPage = lazy(() => import('@/modules/dispatch/DispatchOrderListPage'));
const DispatchOrderFormPage = lazy(() => import('@/modules/dispatch/DispatchOrderFormPage'));
const DispatchRouteListPage = lazy(() => import('@/modules/dispatch/DispatchRouteListPage'));

// Mobile
const MobileReportsPage = lazy(() => import('@/modules/mobile/MobileReportsPage'));
const MobileReportDetailPage = lazy(() => import('@/modules/mobile/MobileReportDetailPage'));
const MobileReportNewPage = lazy(() => import('@/modules/mobile/MobileReportNewPage'));
const MobilePhotosPage = lazy(() => import('@/modules/mobile/MobilePhotosPage'));
const MobileDashboardPage = lazy(() => import('@/modules/mobile/MobileDashboardPage'));

// Support
const SupportTicketsPage = lazy(() => import('@/modules/support/SupportTicketsPage'));
const SupportTicketDetailPage = lazy(() => import('@/modules/support/SupportTicketDetailPage'));
const SupportDashboardPage = lazy(() => import('@/modules/support/SupportDashboardPage'));
const TicketBoardPage = lazy(() => import('@/modules/support/TicketBoardPage'));

export function operationsRoutes() {
  return (
    <>
      {/* Operations */}
      <Route path="operations/daily-logs" element={<OperationsDailyLogsPage />} />
      <Route path="operations/daily-logs/new" element={<DailyLogCreatePage />} />
      <Route path="operations/daily-logs/:id" element={<DailyLogDetailPage />} />
      <Route path="operations/work-orders" element={<WorkOrdersPage />} />
      <Route path="operations/work-orders/board" element={<WorkOrderBoardPage />} />
      <Route path="operations/work-orders/:id" element={<WorkOrderDetailPage />} />
      <Route path="operations/dashboard" element={<OperationsDashboardPage />} />
      <Route path="operations/dispatch-calendar" element={<DispatchCalendarPage />} />

      {/* Fleet */}
      <Route path="fleet" element={<FleetListPage />} />
      <Route path="fleet/new" element={<FleetVehicleFormPage />} />
      <Route path="fleet/:id" element={<FleetDetailPage />} />
      <Route path="fleet/:id/edit" element={<FleetVehicleFormPage />} />
      <Route path="fleet/maintenance" element={<MaintenancePage />} />
      <Route path="fleet/maintenance/board" element={<FleetMaintenanceBoardPage />} />
      <Route path="fleet/fuel" element={<FuelPage />} />
      <Route path="fleet/waybills-esm" element={<WaybillsPage />} />
      <Route path="fleet/fuel-accounting" element={<FuelAccountingPage />} />
      <Route path="fleet/maint-repair" element={<MaintenanceToRepairPage />} />
      <Route path="fleet/gps-tracking" element={<GpsTrackingPage />} />
      <Route path="fleet/driver-rating" element={<DriverRatingPage />} />

      {/* IoT */}
      <Route path="iot/devices" element={<DevicesPage />} />
      <Route path="iot/devices/:id" element={<DeviceDetailPage />} />
      <Route path="iot/sensors" element={<SensorsPage />} />
      <Route path="iot/alerts" element={<AlertsPage />} />

      {/* Maintenance */}
      <Route path="maintenance/requests" element={<MaintenanceRequestListPage />} />
      <Route path="maintenance/requests/new" element={<MaintenanceRequestFormPage />} />
      <Route path="maintenance/requests/:id/edit" element={<MaintenanceRequestFormPage />} />
      <Route path="maintenance/board" element={<MaintenanceBoardPage />} />
      <Route path="maintenance/equipment" element={<EquipmentListPage />} />
      <Route path="maintenance/dashboard" element={<MaintenanceDashboardPage />} />

      {/* Dispatch */}
      <Route path="dispatch/orders" element={<DispatchOrderListPage />} />
      <Route path="dispatch/orders/new" element={<DispatchOrderFormPage />} />
      <Route path="dispatch/orders/:id/edit" element={<DispatchOrderFormPage />} />
      <Route path="dispatch/routes" element={<DispatchRouteListPage />} />

      {/* Mobile */}
      <Route path="mobile/reports" element={<MobileReportsPage />} />
      <Route path="mobile/reports/:id" element={<MobileReportDetailPage />} />
      <Route path="mobile/reports/new" element={<MobileReportNewPage />} />
      <Route path="mobile/photos" element={<MobilePhotosPage />} />
      <Route path="mobile/dashboard" element={<MobileDashboardPage />} />

      {/* Support */}
      <Route path="support/tickets" element={<SupportTicketsPage />} />
      <Route path="support/tickets/board" element={<TicketBoardPage />} />
      <Route path="support/tickets/:id" element={<SupportTicketDetailPage />} />
      <Route path="support/dashboard" element={<SupportDashboardPage />} />
    </>
  );
}
