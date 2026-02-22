import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Clock, CheckCircle, Timer, Building2, FolderKanban } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { defectsApi, type DefectDashboardGroupStats } from '@/api/defects';
import { t } from '@/i18n';

const severityColors: Record<string, string> = {
  CRITICAL: 'bg-red-500',
  HIGH: 'bg-orange-500',
  MEDIUM: 'bg-yellow-500',
  LOW: 'bg-neutral-400',
};

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color?: string }) {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-lg ${color ?? 'bg-neutral-100 dark:bg-neutral-800'}`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">{value}</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">{label}</p>
        </div>
      </div>
    </div>
  );
}

function GroupTable({ title, icon, groups, onRowClick }: {
  title: string;
  icon: React.ReactNode;
  groups: DefectDashboardGroupStats[];
  onRowClick?: (id: string) => void;
}) {
  if (groups.length === 0) return null;

  return (
    <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700">
      <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
        <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
          {icon}
          {title}
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-100 dark:border-neutral-800">
              <th className="text-left px-6 py-3 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('defects.dashboard.colName')}</th>
              <th className="text-center px-3 py-3 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">{t('defects.statusOpen')}</th>
              <th className="text-center px-3 py-3 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">{t('defects.statusInProgress')}</th>
              <th className="text-center px-3 py-3 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">{t('defects.statusFixed')}</th>
              <th className="text-center px-3 py-3 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">{t('defects.statusVerified')}</th>
              <th className="text-center px-3 py-3 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">{t('defects.dashboard.colTotal')}</th>
              <th className="px-6 py-3 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">{t('defects.dashboard.colProgress')}</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => {
              const resolved = g.verified + (g.total - g.open - g.inProgress - g.fixed - g.verified);
              const progressPercent = g.total > 0 ? Math.round((resolved / g.total) * 100) : 0;
              return (
                <tr
                  key={g.id}
                  className="border-b border-neutral-50 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer transition-colors"
                  onClick={() => onRowClick?.(g.id)}
                >
                  <td className="px-6 py-3 font-medium text-neutral-900 dark:text-neutral-100 max-w-[200px] truncate">{g.name}</td>
                  <td className="text-center px-3 py-3">
                    {g.open > 0 ? <span className="inline-flex items-center justify-center min-w-[24px] px-1.5 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-medium">{g.open}</span> : <span className="text-neutral-300 dark:text-neutral-600">0</span>}
                  </td>
                  <td className="text-center px-3 py-3">
                    {g.inProgress > 0 ? <span className="inline-flex items-center justify-center min-w-[24px] px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-medium">{g.inProgress}</span> : <span className="text-neutral-300 dark:text-neutral-600">0</span>}
                  </td>
                  <td className="text-center px-3 py-3">
                    {g.fixed > 0 ? <span className="inline-flex items-center justify-center min-w-[24px] px-1.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium">{g.fixed}</span> : <span className="text-neutral-300 dark:text-neutral-600">0</span>}
                  </td>
                  <td className="text-center px-3 py-3">
                    {g.verified > 0 ? <span className="inline-flex items-center justify-center min-w-[24px] px-1.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium">{g.verified}</span> : <span className="text-neutral-300 dark:text-neutral-600">0</span>}
                  </td>
                  <td className="text-center px-3 py-3 font-semibold text-neutral-900 dark:text-neutral-100">{g.total}</td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-neutral-200 dark:bg-neutral-700 rounded-full h-1.5 min-w-[60px]">
                        <div className="bg-primary-500 h-1.5 rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
                      </div>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400 tabular-nums w-8 text-right">{progressPercent}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const DefectDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['defects', 'dashboard'],
    queryFn: () => defectsApi.getDashboard(),
  });

  if (isLoading || !dashboard) {
    return (
      <div className="animate-pulse p-8 space-y-4">
        <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-1/3" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-neutral-200 dark:bg-neutral-700 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const avgHoursDisplay = dashboard.avgResolutionHours != null
    ? `${Math.round(dashboard.avgResolutionHours)} ${t('defects.slaHours')}`
    : '—';

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('defects.dashboard.title')}
        subtitle={t('defects.dashboard.subtitle')}
        backTo="/defects"
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('defects.breadcrumb'), href: '/defects' },
          { label: t('defects.dashboard.breadcrumb') },
        ]}
      />

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={<AlertTriangle size={18} className="text-yellow-600 dark:text-yellow-400" />}
          label={t('defects.dashboard.openDefects')}
          value={dashboard.totalOpen}
          color="bg-yellow-50 dark:bg-yellow-900/20"
        />
        <StatCard
          icon={<Clock size={18} className="text-danger-600 dark:text-danger-400" />}
          label={t('defects.dashboard.overdueDefects')}
          value={dashboard.totalOverdue}
          color="bg-danger-50 dark:bg-danger-900/20"
        />
        <StatCard
          icon={<Timer size={18} className="text-primary-600 dark:text-primary-400" />}
          label={t('defects.dashboard.avgResolution')}
          value={avgHoursDisplay}
          color="bg-primary-50 dark:bg-primary-900/20"
        />
        <StatCard
          icon={<CheckCircle size={18} className="text-green-600 dark:text-green-400" />}
          label={t('defects.dashboard.bySeverity')}
          value=""
          color="bg-green-50 dark:bg-green-900/20"
        />
      </div>

      {/* Severity breakdown (inline in the 4th card position) */}
      {Object.keys(dashboard.bySeverity).length > 0 && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('defects.dashboard.severityBreakdown')}</h3>
          <div className="flex gap-4 flex-wrap">
            {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map(sev => {
              const count = dashboard.bySeverity[sev] ?? 0;
              if (count === 0) return null;
              return (
                <div key={sev} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${severityColors[sev]}`} />
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">{t(`defects.severity${sev.charAt(0)}${sev.slice(1).toLowerCase()}` as 'defects.severityLow')}</span>
                  <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* By contractor */}
      <div className="mb-6">
        <GroupTable
          title={t('defects.dashboard.byContractor')}
          icon={<Building2 size={16} />}
          groups={dashboard.byContractor}
          onRowClick={(id) => navigate(`/defects?contractorId=${id}`)}
        />
      </div>

      {/* By project */}
      <div className="mb-6">
        <GroupTable
          title={t('defects.dashboard.byProject')}
          icon={<FolderKanban size={16} />}
          groups={dashboard.byProject}
          onRowClick={(id) => navigate(`/defects?projectId=${id}`)}
        />
      </div>
    </div>
  );
};

export default DefectDashboardPage;
