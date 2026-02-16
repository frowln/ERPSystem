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
    </>
  );
}
