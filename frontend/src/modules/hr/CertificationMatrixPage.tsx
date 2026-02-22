import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Award,
  Search,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { hrApi, type Certificate, type CertificationDashboard, type CertificationTypeBreakdown } from '@/api/hr';
import { formatDate } from '@/lib/format';
import { t } from '@/i18n';

const statusColorMap: Record<string, 'green' | 'yellow' | 'red'> = {
  VALID: 'green',
  EXPIRING: 'yellow',
  EXPIRED: 'red',
};

const getStatusLabels = (): Record<string, string> => ({
  VALID: t('certification.statusValid'),
  EXPIRING: t('certification.statusExpiring'),
  EXPIRED: t('certification.statusExpired'),
});

const getCertTypeLabels = (): Record<string, string> => ({
  SAFETY_GENERAL: t('certification.typeSafetyGeneral'),
  SAFETY_HEIGHTS: t('certification.typeSafetyHeights'),
  SAFETY_ELECTRICAL: t('certification.typeSafetyElectrical'),
  SAFETY_FIRE: t('certification.typeSafetyFire'),
  MEDICAL: t('certification.typeMedical'),
  QUALIFICATION: t('certification.typeQualification'),
  DRIVING_LICENSE: t('certification.typeDrivingLicense'),
  WELDING: t('certification.typeWelding'),
  OTHER: t('certification.typeOther'),
});

type TabId = 'all' | 'expiring' | 'expired';

const CertificationMatrixPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const { data: dashboard, isLoading: dashLoading } = useQuery<CertificationDashboard>({
    queryKey: ['certification-dashboard'],
    queryFn: () => hrApi.getCertificationDashboard(),
  });

  // Combine expiring and expired for full list
  const allCerts = useMemo(() => {
    if (!dashboard) return [];
    return [...(dashboard.expiringCertificates ?? []), ...(dashboard.expiredCertificates ?? [])];
  }, [dashboard]);

  const filtered = useMemo(() => {
    let result = allCerts;
    if (activeTab === 'expiring') result = result.filter((c) => c.status === 'EXPIRING');
    else if (activeTab === 'expired') result = result.filter((c) => c.status === 'EXPIRED');
    if (typeFilter) result = result.filter((c) => c.certificateType === typeFilter);
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(lower) ||
          (c.employeeName ?? '').toLowerCase().includes(lower) ||
          (c.number ?? '').toLowerCase().includes(lower),
      );
    }
    return result;
  }, [allCerts, activeTab, typeFilter, search]);

  const typeFilterOptions = useMemo(
    () => [
      { value: '', label: t('certification.filterAllTypes') },
      ...Object.entries(getCertTypeLabels()).map(([v, l]) => ({ value: v, label: l })),
    ],
    [],
  );

  const columns = useMemo<ColumnDef<Certificate, unknown>[]>(
    () => [
      {
        accessorKey: 'employeeName',
        header: t('certification.colEmployee'),
        size: 200,
        cell: ({ getValue, row }) => (
          <button
            className="font-medium text-primary-600 dark:text-primary-400 hover:underline text-left"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/employees/${row.original.employeeId}`);
            }}
          >
            {getValue<string>() || '—'}
          </button>
        ),
      },
      {
        accessorKey: 'name',
        header: t('certification.colCertificate'),
        size: 220,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[200px]">
              {row.original.name}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {getCertTypeLabels()[row.original.certificateType] ?? row.original.certificateType}
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'number',
        header: t('certification.colNumber'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">
            {getValue<string>() || '—'}
          </span>
        ),
      },
      {
        accessorKey: 'issuedDate',
        header: t('certification.colIssued'),
        size: 110,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-700 dark:text-neutral-300">{formatDate(getValue<string>())}</span>
        ),
      },
      {
        accessorKey: 'expiryDate',
        header: t('certification.colExpiry'),
        size: 120,
        cell: ({ row }) => {
          if (!row.original.expiryDate) return <span className="text-neutral-400">—</span>;
          const daysLeft = Math.ceil(
            (new Date(row.original.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
          );
          return (
            <div>
              <span
                className={`tabular-nums ${
                  row.original.expired
                    ? 'text-danger-600 font-medium'
                    : row.original.expiring
                      ? 'text-warning-600 font-medium'
                      : 'text-neutral-700 dark:text-neutral-300'
                }`}
              >
                {formatDate(row.original.expiryDate)}
              </span>
              {daysLeft <= 0 && (
                <p className="text-xs text-danger-500 mt-0.5">
                  {t('certification.daysOverdue', { days: String(Math.abs(daysLeft)) })}
                </p>
              )}
              {daysLeft > 0 && daysLeft <= 90 && (
                <p className="text-xs text-warning-500 mt-0.5">
                  {t('certification.daysLeft', { days: String(daysLeft) })}
                </p>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: t('certification.colStatus'),
        size: 130,
        cell: ({ getValue }) => {
          const val = getValue<string>();
          return <StatusBadge status={val} colorMap={statusColorMap} label={getStatusLabels()[val] ?? val} />;
        },
      },
      {
        accessorKey: 'issuedBy',
        header: t('certification.colIssuedBy'),
        size: 160,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300 text-sm truncate max-w-[150px] block">
            {getValue<string>() || '—'}
          </span>
        ),
      },
    ],
    [navigate],
  );

  // Traffic-light breakdown by cert type
  const typeBreakdown = useMemo(() => {
    if (!dashboard?.byType) return [];
    return Object.entries(dashboard.byType).map(([key, bd]) => ({
      key,
      ...bd,
    }));
  }, [dashboard?.byType]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('certification.title')}
        subtitle={t('certification.subtitle')}
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('certification.breadcrumbHR'), href: '/employees' },
          { label: t('certification.breadcrumbMatrix') },
        ]}
        tabs={[
          { id: 'all', label: t('certification.tabAll'), count: allCerts.length },
          {
            id: 'expiring',
            label: t('certification.tabExpiring'),
            count: dashboard?.expiringCertificates?.length ?? 0,
          },
          {
            id: 'expired',
            label: t('certification.tabExpired'),
            count: dashboard?.expiredCertificates?.length ?? 0,
          },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<Award size={18} />}
          label={t('certification.metricTotal')}
          value={dashboard?.totalCertificates ?? 0}
        />
        <MetricCard
          icon={<ShieldCheck size={18} />}
          label={t('certification.metricValid')}
          value={dashboard?.validCount ?? 0}
        />
        <MetricCard
          icon={<ShieldAlert size={18} />}
          label={t('certification.metricExpiring')}
          value={dashboard?.expiringCount ?? 0}
          trend={
            (dashboard?.expiringCount ?? 0) > 0
              ? { direction: 'down', value: t('certification.requireAttention') }
              : undefined
          }
        />
        <MetricCard
          icon={<ShieldX size={18} />}
          label={t('certification.metricExpired')}
          value={dashboard?.expiredCount ?? 0}
          trend={
            (dashboard?.expiredCount ?? 0) > 0
              ? { direction: 'down', value: t('certification.critical') }
              : undefined
          }
        />
      </div>

      {/* Compliance bar */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {t('certification.complianceTitle')}
          </h3>
          <span
            className={`text-lg font-bold tabular-nums ${
              (dashboard?.compliancePercent ?? 100) >= 90
                ? 'text-success-600'
                : (dashboard?.compliancePercent ?? 100) >= 70
                  ? 'text-warning-600'
                  : 'text-danger-600'
            }`}
          >
            {dashboard?.compliancePercent ?? 100}%
          </span>
        </div>
        <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              (dashboard?.compliancePercent ?? 100) >= 90
                ? 'bg-success-500'
                : (dashboard?.compliancePercent ?? 100) >= 70
                  ? 'bg-warning-500'
                  : 'bg-danger-500'
            }`}
            style={{ width: `${Math.min(dashboard?.compliancePercent ?? 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Type breakdown grid */}
      {typeBreakdown.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {typeBreakdown.map((tb) => (
            <div
              key={tb.key}
              className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {getCertTypeLabels()[tb.key] ?? tb.displayName}
                </h4>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">{tb.total}</span>
              </div>
              <div className="flex gap-2">
                {tb.valid > 0 && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-success-500" />
                    <span className="text-xs text-neutral-600 dark:text-neutral-400 tabular-nums">{tb.valid}</span>
                  </div>
                )}
                {tb.expiring > 0 && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-warning-500" />
                    <span className="text-xs text-neutral-600 dark:text-neutral-400 tabular-nums">{tb.expiring}</span>
                  </div>
                )}
                {tb.expired > 0 && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-danger-500" />
                    <span className="text-xs text-neutral-600 dark:text-neutral-400 tabular-nums">{tb.expired}</span>
                  </div>
                )}
              </div>
              {/* Mini progress bar */}
              <div className="flex h-1.5 rounded-full overflow-hidden mt-2 bg-neutral-100 dark:bg-neutral-800">
                {tb.total > 0 && (
                  <>
                    <div className="bg-success-500" style={{ width: `${(tb.valid / tb.total) * 100}%` }} />
                    <div className="bg-warning-500" style={{ width: `${(tb.expiring / tb.total) * 100}%` }} />
                    <div className="bg-danger-500" style={{ width: `${(tb.expired / tb.total) * 100}%` }} />
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters + Table */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('certification.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={typeFilterOptions}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-52"
        />
      </div>

      <DataTable<Certificate>
        data={filtered}
        columns={columns}
        loading={dashLoading}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('certification.emptyTitle')}
        emptyDescription={t('certification.emptyDescription')}
      />
    </div>
  );
};

export default CertificationMatrixPage;
