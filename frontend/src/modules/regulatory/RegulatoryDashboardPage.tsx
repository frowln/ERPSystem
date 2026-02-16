import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Shield, Award, ClipboardCheck, AlertTriangle,
  Clock, CheckCircle, XCircle, Calendar,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { MetricCard } from '@/design-system/components/MetricCard';
import {
  StatusBadge,
  permitStatusColorMap,
  permitStatusLabels,
  licenseStatusColorMap,
  licenseStatusLabels,
  inspectionStatusColorMap,
  inspectionStatusLabels,
} from '@/design-system/components/StatusBadge';
import { formatDate } from '@/lib/format';
import { regulatoryApi } from '@/api/regulatory';
import { t } from '@/i18n';

interface UpcomingItem {
  id: string;
  type: 'PERMIT' | 'license' | 'INSPECTION';
  name: string;
  date: string;
  status: string;
  project?: string;
}

interface ComplianceAlert {
  id: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  description: string;
  dueDate?: string;
}

const severityStyles: Record<string, { bg: string; icon: string }> = {
  CRITICAL: { bg: 'bg-danger-50', icon: 'text-danger-600' },
  WARNING: { bg: 'bg-warning-50', icon: 'text-warning-600' },
  INFO: { bg: 'bg-primary-50', icon: 'text-primary-600' },
};

const RegulatoryDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const { data: permitsData } = useQuery({
    queryKey: ['regulatory-permits-dashboard'],
    queryFn: () => regulatoryApi.getPermits({ size: 100 }),
  });

  const { data: licensesData } = useQuery({
    queryKey: ['regulatory-licenses-dashboard'],
    queryFn: () => regulatoryApi.getLicenses({ size: 100 }),
  });

  const { data: inspectionsData } = useQuery({
    queryKey: ['regulatory-inspections-dashboard'],
    queryFn: () => regulatoryApi.getInspections({ size: 100 }),
  });

  const permits = permitsData?.content ?? [];
  const licenses = licensesData?.content ?? [];
  const inspections = inspectionsData?.content ?? [];

  const complianceAlerts = useMemo<ComplianceAlert[]>(() => {
    const alerts: ComplianceAlert[] = [];
    permits.forEach((p) => {
      if (p.validUntil) {
        const daysLeft = Math.floor((new Date(p.validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (daysLeft > 0 && daysLeft <= 30) {
          alerts.push({ id: `perm-${p.id}`, severity: 'CRITICAL', title: t('regulatory.alertPermitExpiring', { number: p.number }), description: t('regulatory.alertPermitExpiringDesc', { days: String(daysLeft) }), dueDate: p.validUntil });
        }
      }
    });
    licenses.forEach((l) => {
      if (l.status === 'EXPIRING_SOON') {
        alerts.push({ id: `lic-${l.id}`, severity: 'WARNING', title: t('regulatory.alertLicenseExpiring', { number: l.number }), description: t('regulatory.alertLicenseExpiringDesc', { name: l.name }), dueDate: l.validUntil });
      }
    });
    return alerts;
  }, [permits, licenses]);

  const upcomingItems = useMemo<UpcomingItem[]>(() => {
    const items: UpcomingItem[] = [];
    permits.slice(0, 3).forEach((p) => {
      items.push({ id: p.id, type: 'PERMIT', name: `${p.name} ${p.number}`, date: p.validUntil ?? p.issuedDate ?? '', status: p.status, project: p.projectName ?? undefined });
    });
    inspections.filter((i) => i.status === 'SCHEDULED').slice(0, 3).forEach((i) => {
      items.push({ id: i.id, type: 'INSPECTION', name: i.name ?? t('regulatory.defaultInspectionName'), date: i.scheduledDate ?? '', status: i.status, project: i.projectName ?? undefined });
    });
    return items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 5);
  }, [permits, inspections]);

  const metricsPermits = permits.length;
  const metricsLicenses = licenses.length;
  const metricsInspections = inspections.length;
  const metricsAttention = complianceAlerts.length;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('regulatory.dashboardTitle')}
        subtitle={t('regulatory.dashboardSubtitle')}
        breadcrumbs={[
          { label: t('regulatory.breadcrumbHome'), href: '/' },
          { label: t('regulatory.breadcrumbRegulatory') },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => navigate('/regulatory/permits')}>{t('regulatory.btnPermits')}</Button>
            <Button variant="secondary" onClick={() => navigate('/regulatory/licenses')}>{t('regulatory.btnLicenses')}</Button>
            <Button variant="secondary" onClick={() => navigate('/regulatory/inspections')}>{t('regulatory.btnInspections')}</Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<Shield size={18} />} label={t('regulatory.metricPermits')} value={metricsPermits} trend={{ direction: 'neutral', value: t('regulatory.trendActive', { count: String(permits.filter(p => p.status === 'ACTIVE').length) }) }} />
        <MetricCard icon={<Award size={18} />} label={t('regulatory.metricLicensesSro')} value={metricsLicenses} trend={{ direction: 'neutral', value: t('regulatory.trendActive', { count: String(licenses.filter(l => l.status === 'ACTIVE').length) }) }} />
        <MetricCard icon={<ClipboardCheck size={18} />} label={t('regulatory.metricInspections')} value={metricsInspections} trend={{ direction: 'neutral', value: t('regulatory.trendScheduled', { count: String(inspections.filter(i => i.status === 'SCHEDULED').length) }) }} />
        <MetricCard icon={<AlertTriangle size={18} />} label={t('regulatory.metricAttention')} value={metricsAttention} trend={metricsAttention > 0 ? { direction: 'down', value: t('regulatory.trendCritical') } : undefined} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compliance alerts */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('regulatory.complianceAlerts')}</h3>
            <div className="space-y-3">
              {complianceAlerts.map((alert) => {
                const styles = severityStyles[alert.severity];
                return (
                  <div key={alert.id} className={`flex items-start gap-3 p-4 rounded-lg ${styles.bg}`}>
                    {alert.severity === 'CRITICAL' ? (
                      <XCircle size={18} className={`${styles.icon} mt-0.5 flex-shrink-0`} />
                    ) : alert.severity === 'WARNING' ? (
                      <AlertTriangle size={18} className={`${styles.icon} mt-0.5 flex-shrink-0`} />
                    ) : (
                      <Clock size={18} className={`${styles.icon} mt-0.5 flex-shrink-0`} />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{alert.title}</p>
                      <p className="text-xs text-neutral-600 mt-0.5">{alert.description}</p>
                      {alert.dueDate && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 tabular-nums">{t('regulatory.deadlinePrefix', { date: formatDate(alert.dueDate) })}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Upcoming events */}
        <div>
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('regulatory.upcomingEvents')}</h3>
            <div className="space-y-3">
              {upcomingItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
                  onClick={() => {
                    if (item.type === 'PERMIT') navigate(`/regulatory/permits/${item.id}`);
                    else if (item.type === 'license') navigate(`/regulatory/licenses/${item.id}`);
                    else navigate(`/regulatory/inspections/${item.id}`);
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {item.type === 'PERMIT' && <Shield size={14} className="text-neutral-400" />}
                    {item.type === 'license' && <Award size={14} className="text-neutral-400" />}
                    {item.type === 'INSPECTION' && <ClipboardCheck size={14} className="text-neutral-400" />}
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">{formatDate(item.date)}</span>
                  </div>
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{item.name}</p>
                  {item.project && <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{item.project}</p>}
                  <div className="mt-1.5">
                    <StatusBadge
                      status={item.status}
                      colorMap={
                        item.type === 'PERMIT' ? permitStatusColorMap :
                        item.type === 'license' ? licenseStatusColorMap :
                        inspectionStatusColorMap
                      }
                      label={
                        item.type === 'PERMIT' ? permitStatusLabels[item.status] :
                        item.type === 'license' ? licenseStatusLabels[item.status] :
                        inspectionStatusLabels[item.status]
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary cards */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mt-6">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('regulatory.projectSummary')}</h3>
            <div className="space-y-3">
              {[t('regulatory.projectSunny'), t('regulatory.projectBridgeLabel'), t('regulatory.projectCentral')].map((project) => (
                <div key={project} className="flex items-center justify-between p-2">
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">{project}</span>
                  <div className="flex items-center gap-1">
                    <CheckCircle size={14} className="text-success-500" />
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">{t('regulatory.statusActive')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegulatoryDashboardPage;
