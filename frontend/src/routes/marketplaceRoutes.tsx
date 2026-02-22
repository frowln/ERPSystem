import React, { lazy } from 'react';
import { Route } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';

const MarketplaceListPage = lazy(() => import('@/modules/marketplace/MarketplaceListPage'));
const MarketplaceInstalledPage = lazy(() => import('@/modules/marketplace/MarketplaceInstalledPage'));
const MarketplaceDetailPage = lazy(() => import('@/modules/marketplace/MarketplaceDetailPage'));

export function marketplaceRoutes() {
  return (
    <>
      <Route path="marketplace" element={<ProtectedRoute><MarketplaceListPage /></ProtectedRoute>} />
      <Route path="marketplace/installed" element={<ProtectedRoute><MarketplaceInstalledPage /></ProtectedRoute>} />
      <Route path="marketplace/:pluginId" element={<ProtectedRoute><MarketplaceDetailPage /></ProtectedRoute>} />
    </>
  );
}
