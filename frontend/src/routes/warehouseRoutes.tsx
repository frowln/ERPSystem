import React, { lazy } from 'react';
import { Route } from 'react-router-dom';

const WarehouseLocationsPage = lazy(() => import('@/modules/warehouse/WarehouseLocationsPage'));
const StockPage = lazy(() => import('@/modules/warehouse/StockPage'));
const MaterialListPage = lazy(() => import('@/modules/warehouse/MaterialListPage'));
const MaterialDetailPage = lazy(() => import('@/modules/warehouse/MaterialDetailPage'));
const MaterialFormPage = lazy(() => import('@/modules/warehouse/MaterialFormPage'));
const MovementListPage = lazy(() => import('@/modules/warehouse/MovementListPage'));
const MovementFormPage = lazy(() => import('@/modules/warehouse/MovementFormPage'));
const InventoryPage = lazy(() => import('@/modules/warehouse/InventoryPage'));
const MovementBoardPage = lazy(() => import('@/modules/warehouse/MovementBoardPage'));
const StockLimitsPage = lazy(() => import('@/modules/warehouse/StockLimitsPage'));
const StockAlertsPage = lazy(() => import('@/modules/warehouse/StockAlertsPage'));
const M29ReportPage = lazy(() => import('@/modules/warehouse/M29ReportPage'));
const LimitFenceCardsPage = lazy(() => import('@/modules/warehouse/LimitFenceCardsPage'));
const WarehouseOrdersPage = lazy(() => import('@/modules/warehouse/WarehouseOrdersPage'));
const AddressStoragePage = lazy(() => import('@/modules/warehouse/AddressStoragePage'));
const MaterialDemandPage = lazy(() => import('@/modules/warehouse/MaterialDemandPage'));
const BarcodeScannerPage = lazy(() => import('@/modules/warehouse/BarcodeScannerPage'));
const InterProjectTransferPage = lazy(() => import('@/modules/warehouse/InterProjectTransferPage'));
const InterSiteTransferPage = lazy(() => import('@/modules/warehouse/InterSiteTransferPage'));
const LimitFenceSheetListPage = lazy(() => import('@/modules/warehouse/LimitFenceSheetListPage'));
const LimitFenceSheetDetailPage = lazy(() => import('@/modules/warehouse/LimitFenceSheetDetailPage'));
const LimitFenceSheetFormPage = lazy(() => import('@/modules/warehouse/LimitFenceSheetFormPage'));
const MovementDetailPage = lazy(() => import('@/modules/warehouse/MovementDetailPage'));
const QuickConfirmPage = lazy(() => import('@/modules/warehouse/QuickConfirmPage'));
const QuickReceiptPage = lazy(() => import('@/modules/warehouse/QuickReceiptPage'));
const WarehouseOrderListPage = lazy(() => import('@/modules/warehouse/WarehouseOrderListPage'));
const WarehouseOrderDetailPage = lazy(() => import('@/modules/warehouse/WarehouseOrderDetailPage'));
const WarehouseOrderFormPage = lazy(() => import('@/modules/warehouse/WarehouseOrderFormPage'));

export function warehouseRoutes() {
  return (
    <>
      <Route path="warehouse/locations" element={<WarehouseLocationsPage />} />
      <Route path="warehouse/stock" element={<StockPage />} />
      <Route path="warehouse/materials" element={<MaterialListPage />} />
      <Route path="warehouse/materials/new" element={<MaterialFormPage />} />
      <Route path="warehouse/materials/:id" element={<MaterialDetailPage />} />
      <Route path="warehouse/materials/:id/edit" element={<MaterialFormPage />} />
      <Route path="warehouse/movements" element={<MovementListPage />} />
      <Route path="warehouse/movements/board" element={<MovementBoardPage />} />
      <Route path="warehouse/movements/new" element={<MovementFormPage />} />
      <Route path="warehouse/movements/:id/edit" element={<MovementFormPage />} />
      <Route path="warehouse/inventory" element={<InventoryPage />} />
      <Route path="warehouse/stock-limits" element={<StockLimitsPage />} />
      <Route path="warehouse/stock-alerts" element={<StockAlertsPage />} />
      <Route path="warehouse/m29-report" element={<M29ReportPage />} />
      <Route path="warehouse/limit-fence-cards" element={<LimitFenceCardsPage />} />
      <Route path="warehouse/warehouse-orders" element={<WarehouseOrdersPage />} />
      <Route path="warehouse/address-storage" element={<AddressStoragePage />} />
      <Route path="warehouse/material-demand" element={<MaterialDemandPage />} />
      <Route path="warehouse/barcode-scanner" element={<BarcodeScannerPage />} />
      <Route path="warehouse/inter-project-transfer" element={<InterProjectTransferPage />} />
      <Route path="warehouse/inter-site-transfer" element={<InterSiteTransferPage />} />
      <Route path="warehouse/limit-fence-sheets" element={<LimitFenceSheetListPage />} />
      <Route path="warehouse/limit-fence-sheets/new" element={<LimitFenceSheetFormPage />} />
      <Route path="warehouse/limit-fence-sheets/:id" element={<LimitFenceSheetDetailPage />} />
      <Route path="warehouse/limit-fence-sheets/:id/edit" element={<LimitFenceSheetFormPage />} />
      <Route path="warehouse/movements/:id" element={<MovementDetailPage />} />
      <Route path="warehouse/quick-confirm" element={<QuickConfirmPage />} />
      <Route path="warehouse/quick-receipt" element={<QuickReceiptPage />} />
      <Route path="warehouse/orders" element={<WarehouseOrderListPage />} />
      <Route path="warehouse/orders/new" element={<WarehouseOrderFormPage />} />
      <Route path="warehouse/orders/:id" element={<WarehouseOrderDetailPage />} />
      <Route path="warehouse/orders/:id/edit" element={<WarehouseOrderFormPage />} />
    </>
  );
}
