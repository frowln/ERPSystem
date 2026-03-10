import React, { lazy } from 'react';
import { Route } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';

const DefectListPage = lazy(() => import('@/modules/defects/DefectListPage'));
const DefectDetailPage = lazy(() => import('@/modules/defects/DefectDetailPage'));
const DefectFormPage = lazy(() => import('@/modules/defects/DefectFormPage'));
const DefectDashboardPage = lazy(() => import('@/modules/defects/DefectDashboardPage'));
const DefectOnPlanPage = lazy(() => import('@/modules/defects/DefectOnPlanPage'));

export function defectsRoutes() {
  return (
    <>
      <Route path="defects" element={<ProtectedRoute><DefectListPage /></ProtectedRoute>} />
      <Route path="defects/dashboard" element={<ProtectedRoute><DefectDashboardPage /></ProtectedRoute>} />
      <Route path="defects/new" element={<ProtectedRoute><DefectFormPage /></ProtectedRoute>} />
      <Route path="defects/:id" element={<ProtectedRoute><DefectDetailPage /></ProtectedRoute>} />
      <Route path="defects/:id/edit" element={<ProtectedRoute><DefectFormPage /></ProtectedRoute>} />
      <Route path="defects/on-plan" element={<ProtectedRoute><DefectOnPlanPage /></ProtectedRoute>} />
    </>
  );
}
