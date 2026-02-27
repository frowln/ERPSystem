import React, { lazy } from 'react';
import { Route } from 'react-router-dom';

// Portfolio
const OpportunitiesPage = lazy(() => import('@/modules/portfolio/OpportunitiesPage'));
const OpportunityDetailPage = lazy(() => import('@/modules/portfolio/OpportunityDetailPage'));
const TendersPage = lazy(() => import('@/modules/portfolio/TendersPage'));
const BidComparisonPage = lazy(() => import('@/modules/portfolio/BidComparisonPage'));
const OpportunityFormPage = lazy(() => import('@/modules/portfolio/OpportunityFormPage'));

// Site Assessment
const SiteAssessmentListPage = lazy(() => import('@/modules/siteAssessment/SiteAssessmentListPage'));

// CRM
const CrmLeadListPage = lazy(() => import('@/modules/crm/CrmLeadListPage'));
const CrmLeadDetailPage = lazy(() => import('@/modules/crm/CrmLeadDetailPage'));
const CrmLeadFormPage = lazy(() => import('@/modules/crm/CrmLeadFormPage'));
const CrmDashboardPage = lazy(() => import('@/modules/crm/CrmDashboardPage'));

// Legal
const LegalCaseListPage = lazy(() => import('@/modules/legal/LegalCaseListPage'));
const LegalCaseDetailPage = lazy(() => import('@/modules/legal/LegalCaseDetailPage'));
const LegalTemplateListPage = lazy(() => import('@/modules/legal/LegalTemplateListPage'));

// KEP
const KepCertificateListPage = lazy(() => import('@/modules/kep/KepCertificateListPage'));
const KepCertificateDetailPage = lazy(() => import('@/modules/kep/KepCertificateDetailPage'));
const KepSigningRequestListPage = lazy(() => import('@/modules/kep/KepSigningRequestListPage'));
const KepSigningPage = lazy(() => import('@/modules/kep/KepSigningPage'));
const KepVerificationPage = lazy(() => import('@/modules/kep/KepVerificationPage'));
const MchDListPage = lazy(() => import('@/modules/kep/MchDListPage'));

// Analytics
const AnalyticsDashboardPage = lazy(() => import('@/modules/analytics/AnalyticsDashboardPage'));
const ReportsPage = lazy(() => import('@/modules/analytics/ReportsPage'));
const KpiPage = lazy(() => import('@/modules/analytics/KpiPage'));
const KpiAchievementsPage = lazy(() => import('@/modules/analytics/KpiAchievementsPage'));
const BonusCalculationsPage = lazy(() => import('@/modules/analytics/BonusCalculationsPage'));
const AuditPivotPage = lazy(() => import('@/modules/analytics/AuditPivotPage'));
const ProjectAnalyticsChartPage = lazy(() => import('@/modules/analytics/ProjectAnalyticsChartPage'));

// Monitoring
const MonitoringDashboardPage = lazy(() => import('@/modules/monitoring/MonitoringDashboardPage'));

// Messaging
const MessagingPage = lazy(() => import('@/pages/MessagingPage'));
const FavoritesPage = lazy(() => import('@/pages/FavoritesPage'));
const CallsPage = lazy(() => import('@/pages/CallsPage'));

// Portal
const PortalDashboardPage = lazy(() => import('@/modules/portal/PortalDashboardPage'));
const PortalProjectListPage = lazy(() => import('@/modules/portal/PortalProjectListPage'));
const PortalDocumentListPage = lazy(() => import('@/modules/portal/PortalDocumentListPage'));
const PortalMessageListPage = lazy(() => import('@/modules/portal/PortalMessageListPage'));
const PortalAdminPage = lazy(() => import('@/modules/portal/PortalAdminPage'));

// Search & AI
const GlobalSearchPage = lazy(() => import('@/modules/search/GlobalSearchPage'));
const AiAssistantPage = lazy(() => import('@/modules/ai/AiAssistantPage'));

export function portfolioRoutes() {
  return (
    <>
      {/* Site Assessment */}
      <Route path="site-assessments" element={<SiteAssessmentListPage />} />

      {/* Portfolio */}
      <Route path="portfolio/opportunities" element={<OpportunitiesPage />} />
      <Route path="portfolio/opportunities/new" element={<OpportunityFormPage />} />
      <Route path="portfolio/opportunities/:id" element={<OpportunityDetailPage />} />
      <Route path="portfolio/opportunities/:id/edit" element={<OpportunityFormPage />} />
      <Route path="portfolio/tenders" element={<TendersPage />} />
      <Route path="portfolio/bid-comparison" element={<BidComparisonPage />} />

      {/* CRM */}
      <Route path="crm/leads" element={<CrmLeadListPage />} />
      <Route path="crm/leads/new" element={<CrmLeadFormPage />} />
      <Route path="crm/leads/:id" element={<CrmLeadDetailPage />} />
      <Route path="crm/leads/:id/edit" element={<CrmLeadFormPage />} />
      <Route path="crm/dashboard" element={<CrmDashboardPage />} />

      {/* Legal */}
      <Route path="legal/cases" element={<LegalCaseListPage />} />
      <Route path="legal/cases/:id" element={<LegalCaseDetailPage />} />
      <Route path="legal/templates" element={<LegalTemplateListPage />} />

      {/* KEP */}
      <Route path="kep/certificates" element={<KepCertificateListPage />} />
      <Route path="kep/certificates/:id" element={<KepCertificateDetailPage />} />
      <Route path="kep/signing-requests" element={<KepSigningRequestListPage />} />
      <Route path="kep/signing" element={<KepSigningPage />} />
      <Route path="kep/verification" element={<KepVerificationPage />} />
      <Route path="kep/mchd" element={<MchDListPage />} />

      {/* Analytics */}
      <Route path="analytics" element={<AnalyticsDashboardPage />} />
      <Route path="reports" element={<ReportsPage />} />
      <Route path="kpi" element={<KpiPage />} />
      <Route path="analytics/kpi-achievements" element={<KpiAchievementsPage />} />
      <Route path="analytics/bonus-calculations" element={<BonusCalculationsPage />} />
      <Route path="analytics/audit-pivot" element={<AuditPivotPage />} />
      <Route path="analytics/project-charts" element={<ProjectAnalyticsChartPage />} />
      <Route path="monitoring" element={<MonitoringDashboardPage />} />

      {/* Messaging */}
      <Route path="messaging" element={<MessagingPage />} />
      <Route path="messaging/favorites" element={<FavoritesPage />} />
      <Route path="messaging/calls" element={<CallsPage />} />

      {/* Portal */}
      <Route path="portal" element={<PortalDashboardPage />} />
      <Route path="portal/projects" element={<PortalProjectListPage />} />
      <Route path="portal/documents" element={<PortalDocumentListPage />} />
      <Route path="portal/messages" element={<PortalMessageListPage />} />
      <Route path="portal/admin" element={<PortalAdminPage />} />

      {/* Search & AI */}
      <Route path="search" element={<GlobalSearchPage />} />
      <Route path="ai-assistant" element={<AiAssistantPage />} />
    </>
  );
}
