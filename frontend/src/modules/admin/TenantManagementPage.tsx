import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2, Users, FolderKanban, Search, X, ChevronLeft, ChevronRight,
  Shield, Ban, CheckCircle, XCircle, Calendar, Mail, Phone, MapPin,
  CreditCard, Clock, ArrowUpDown, ArrowUp, ArrowDown, Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/cn';
import { PageHeader } from '@/design-system/components/PageHeader';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { t } from '@/i18n';
import { adminApi, type TenantListItem, type TenantDetail } from '@/api/admin';
import { formatDate } from '@/lib/format';

/* ─── Status config ─── */
const statusColorMap: Record<string, string> = {
  ACTIVE: 'green',
  SUSPENDED: 'orange',
  CANCELLED: 'red',
};

const subscriptionStatusColorMap: Record<string, string> = {
  ACTIVE: 'green',
  TRIAL: 'blue',
  EXPIRED: 'orange',
  CANCELLED: 'red',
  NONE: 'gray',
};

const planColorMap: Record<string, string> = {
  FREE: 'gray',
  PRO: 'blue',
  ENTERPRISE: 'purple',
};

type SortField = 'name' | 'userCount' | 'projectCount' | 'createdAt';
type SortDir = 'asc' | 'desc';

/* ─── Embeddable content (no PageHeader) ─── */
export const TenantManagementContent: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const pageSize = 20;

  // ── List query ──
  const { data: tenantsData, isLoading } = useQuery({
    queryKey: ['admin-tenants', search, page, pageSize],
    queryFn: () => adminApi.getTenants({ search: search || undefined, page, size: pageSize }),
    refetchInterval: 30000,
  });

  // ── Detail query ──
  const { data: tenantDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['admin-tenant-detail', selectedTenantId],
    queryFn: () => adminApi.getTenantDetail(selectedTenantId!),
    enabled: !!selectedTenantId,
  });

  // ── Mutations ──
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => adminApi.updateTenantStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tenants'] });
      queryClient.invalidateQueries({ queryKey: ['admin-tenant-detail'] });
      toast.success(t('tenants.statusUpdated'));
    },
    onError: () => {
      toast.error(t('tenants.statusUpdateError'));
    },
  });

  const planMutation = useMutation({
    mutationFn: ({ id, planId }: { id: string; planId: string }) => adminApi.updateTenantPlan(id, planId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tenants'] });
      queryClient.invalidateQueries({ queryKey: ['admin-tenant-detail'] });
      toast.success(t('tenants.planUpdated'));
    },
    onError: () => {
      toast.error(t('tenants.planUpdateError'));
    },
  });

  const allTenants = tenantsData?.content ?? [];
  const totalElements = tenantsData?.totalElements ?? 0;
  const totalPages = tenantsData?.totalPages ?? 1;

  // ── Client-side sort + filter ──
  const filteredAndSorted = useMemo(() => {
    let items = [...allTenants];

    // Filter by status
    if (statusFilter !== 'ALL') {
      items = items.filter((t) => t.status === statusFilter);
    }

    // Sort
    items.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'name':
          cmp = (a.name ?? '').localeCompare(b.name ?? '');
          break;
        case 'userCount':
          cmp = a.userCount - b.userCount;
          break;
        case 'projectCount':
          cmp = a.projectCount - b.projectCount;
          break;
        case 'createdAt':
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });

    return items;
  }, [allTenants, statusFilter, sortField, sortDir]);

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  }, [sortField]);

  const SortIcon: React.FC<{ field: SortField }> = ({ field }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3.5 w-3.5 text-neutral-400" />;
    return sortDir === 'asc'
      ? <ArrowUp className="h-3.5 w-3.5 text-primary-600" />
      : <ArrowDown className="h-3.5 w-3.5 text-primary-600" />;
  };

  // ── KPI metrics ──
  const activeCount = allTenants.filter((t) => t.status === 'ACTIVE').length;
  const suspendedCount = allTenants.filter((t) => t.status === 'SUSPENDED').length;
  const totalUsers = allTenants.reduce((sum, t) => sum + t.userCount, 0);
  const totalProjects = allTenants.reduce((sum, t) => sum + t.projectCount, 0);

  return (
    <div className="space-y-6">
      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard
          icon={<Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
          label={t('tenants.metricTotal')}
          value={totalElements}
          bg="bg-blue-50 dark:bg-blue-900/20"
        />
        <MetricCard
          icon={<CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />}
          label={t('tenants.metricActive')}
          value={activeCount}
          bg="bg-green-50 dark:bg-green-900/20"
        />
        <MetricCard
          icon={<Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />}
          label={t('tenants.metricUsers')}
          value={totalUsers}
          bg="bg-purple-50 dark:bg-purple-900/20"
        />
        <MetricCard
          icon={<FolderKanban className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
          label={t('tenants.metricProjects')}
          value={totalProjects}
          bg="bg-amber-50 dark:bg-amber-900/20"
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── Main table ── */}
        <div className="flex-1 min-w-0">
          {/* Search + Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                placeholder={t('tenants.searchPlaceholder')}
                className="w-full pl-10 pr-9 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="h-4 w-4 text-neutral-400 hover:text-neutral-600" />
                </button>
              )}
            </div>
            <div className="flex gap-2">
              {['ALL', 'ACTIVE', 'SUSPENDED'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    'px-3 py-2 rounded-lg text-xs font-medium border transition-colors',
                    statusFilter === s
                      ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-300'
                      : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300',
                  )}
                >
                  {s === 'ALL' ? t('tenants.filterAll') : t(`tenants.status${s.charAt(0) + s.slice(1).toLowerCase()}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 dark:border-neutral-800">
                    <th className="text-left p-3 font-medium text-neutral-500 dark:text-neutral-400">
                      <button onClick={() => handleSort('name')} className="flex items-center gap-1.5 hover:text-neutral-700 dark:hover:text-neutral-200">
                        {t('tenants.colOrganization')} <SortIcon field="name" />
                      </button>
                    </th>
                    <th className="text-left p-3 font-medium text-neutral-500 dark:text-neutral-400">{t('tenants.colInn')}</th>
                    <th className="text-left p-3 font-medium text-neutral-500 dark:text-neutral-400">{t('tenants.colStatus')}</th>
                    <th className="text-left p-3 font-medium text-neutral-500 dark:text-neutral-400">{t('tenants.colPlan')}</th>
                    <th className="text-right p-3 font-medium text-neutral-500 dark:text-neutral-400">
                      <button onClick={() => handleSort('userCount')} className="flex items-center gap-1.5 ml-auto hover:text-neutral-700 dark:hover:text-neutral-200">
                        {t('tenants.colUsers')} <SortIcon field="userCount" />
                      </button>
                    </th>
                    <th className="text-right p-3 font-medium text-neutral-500 dark:text-neutral-400">
                      <button onClick={() => handleSort('projectCount')} className="flex items-center gap-1.5 ml-auto hover:text-neutral-700 dark:hover:text-neutral-200">
                        {t('tenants.colProjects')} <SortIcon field="projectCount" />
                      </button>
                    </th>
                    <th className="text-left p-3 font-medium text-neutral-500 dark:text-neutral-400">
                      <button onClick={() => handleSort('createdAt')} className="flex items-center gap-1.5 hover:text-neutral-700 dark:hover:text-neutral-200">
                        {t('tenants.colRegistered')} <SortIcon field="createdAt" />
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-neutral-50 dark:border-neutral-800/50">
                        {Array.from({ length: 7 }).map((__, j) => (
                          <td key={j} className="p-3">
                            <div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : filteredAndSorted.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-neutral-400">
                        <Building2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">{t('tenants.empty')}</p>
                      </td>
                    </tr>
                  ) : (
                    filteredAndSorted.map((tenant) => (
                      <tr
                        key={tenant.id}
                        onClick={() => setSelectedTenantId(tenant.id)}
                        className={cn(
                          'border-b border-neutral-50 dark:border-neutral-800/50 cursor-pointer transition-colors',
                          selectedTenantId === tenant.id
                            ? 'bg-primary-50/50 dark:bg-primary-900/10'
                            : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50',
                        )}
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                              <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <span className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[200px]">
                              {tenant.name}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-neutral-600 dark:text-neutral-400 font-mono text-xs">
                          {tenant.inn || '---'}
                        </td>
                        <td className="p-3">
                          <StatusBadge status={tenant.status} colorMap={statusColorMap as any} label={t(`tenants.status${tenant.status.charAt(0) + tenant.status.slice(1).toLowerCase()}`)} />
                        </td>
                        <td className="p-3">
                          <span className={cn(
                            'text-xs font-medium px-2 py-0.5 rounded-full',
                            tenant.planName === 'ENTERPRISE' ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400' :
                            tenant.planName === 'PRO' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' :
                            'bg-neutral-50 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
                          )}>
                            {t(`tenants.plan${tenant.planName.charAt(0) + tenant.planName.slice(1).toLowerCase()}`)}
                          </span>
                        </td>
                        <td className="p-3 text-right tabular-nums text-neutral-700 dark:text-neutral-300">
                          {tenant.userCount}
                        </td>
                        <td className="p-3 text-right tabular-nums text-neutral-700 dark:text-neutral-300">
                          {tenant.projectCount}
                        </td>
                        <td className="p-3 text-neutral-500 dark:text-neutral-400 text-xs tabular-nums">
                          {tenant.createdAt ? formatDate(tenant.createdAt) : '---'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-100 dark:border-neutral-800">
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  {t('tenants.showing', { from: String(page * pageSize + 1), to: String(Math.min((page + 1) * pageSize, totalElements)), total: String(totalElements) })}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 disabled:opacity-40 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-xs text-neutral-600 dark:text-neutral-400 px-2 tabular-nums">
                    {page + 1} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 disabled:opacity-40 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Detail Panel ── */}
        {selectedTenantId && (
          <div className="w-full lg:w-[420px] shrink-0">
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5 sticky top-4">
              {detailLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 text-neutral-400 animate-spin" />
                </div>
              ) : tenantDetail ? (
                <TenantDetailPanel
                  detail={tenantDetail}
                  onClose={() => setSelectedTenantId(null)}
                  onStatusChange={(status) => statusMutation.mutate({ id: tenantDetail.id, status })}
                  onPlanChange={(planId) => planMutation.mutate({ id: tenantDetail.id, planId })}
                  isMutating={statusMutation.isPending || planMutation.isPending}
                />
              ) : (
                <div className="text-center py-12 text-neutral-400">
                  <Building2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">{t('tenants.notFound')}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── Metric Card ─── */
const MetricCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: number;
  bg: string;
}> = ({ icon, label, value, bg }) => (
  <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
    <div className={cn('inline-flex p-2 rounded-lg mb-3', bg)}>{icon}</div>
    <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">{value}</p>
    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{label}</p>
  </div>
);

/* ─── Detail Panel ─── */
const TenantDetailPanel: React.FC<{
  detail: TenantDetail;
  onClose: () => void;
  onStatusChange: (status: string) => void;
  onPlanChange: (planId: string) => void;
  isMutating: boolean;
}> = ({ detail, onClose, onStatusChange, onPlanChange, isMutating }) => (
  <div className="space-y-5">
    {/* Header */}
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
          <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">{detail.name}</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">{detail.type}</p>
        </div>
      </div>
      <button onClick={onClose} className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800">
        <X className="h-4 w-4 text-neutral-400" />
      </button>
    </div>

    {/* Status + Plan */}
    <div className="flex items-center gap-2 flex-wrap">
      <StatusBadge status={detail.status} colorMap={statusColorMap as any} label={t(`tenants.status${detail.status.charAt(0) + detail.status.slice(1).toLowerCase()}`)} />
      <span className={cn(
        'text-xs font-medium px-2 py-0.5 rounded-full',
        detail.planName === 'ENTERPRISE' ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400' :
        detail.planName === 'PRO' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' :
        'bg-neutral-50 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
      )}>
        {detail.planDisplayName || detail.planName}
      </span>
      {detail.subscriptionStatus && detail.subscriptionStatus !== 'NONE' && (
        <StatusBadge status={detail.subscriptionStatus} colorMap={subscriptionStatusColorMap as any} label={detail.subscriptionStatus} />
      )}
    </div>

    {/* Plan change */}
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{t('tenants.changePlan')}</p>
      <div className="flex gap-1.5">
        {['FREE', 'PRO', 'ENTERPRISE'].map((plan) => (
          <button
            key={plan}
            onClick={() => onPlanChange(plan)}
            disabled={isMutating || detail.planName === plan}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-50',
              detail.planName === plan
                ? plan === 'ENTERPRISE' ? 'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300'
                : plan === 'PRO' ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                : 'bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300'
                : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-600',
            )}
          >
            {t(`tenants.plan${plan.charAt(0) + plan.slice(1).toLowerCase()}`)}
          </button>
        ))}
      </div>
    </div>

    {/* Stats */}
    <div className="grid grid-cols-3 gap-3">
      <div className="text-center p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
        <Users className="h-4 w-4 mx-auto text-purple-500 mb-1" />
        <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">{detail.userCount}</p>
        <p className="text-[10px] text-neutral-500 dark:text-neutral-400">{t('tenants.users')}</p>
      </div>
      <div className="text-center p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
        <FolderKanban className="h-4 w-4 mx-auto text-amber-500 mb-1" />
        <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">{detail.projectCount}</p>
        <p className="text-[10px] text-neutral-500 dark:text-neutral-400">{t('tenants.projects')}</p>
      </div>
      <div className="text-center p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
        <CreditCard className="h-4 w-4 mx-auto text-blue-500 mb-1" />
        <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">{detail.storageUsedMb}</p>
        <p className="text-[10px] text-neutral-500 dark:text-neutral-400">MB</p>
      </div>
    </div>

    {/* Info fields */}
    <div className="space-y-2.5">
      <InfoRow icon={<Shield className="h-3.5 w-3.5" />} label={t('tenants.inn')} value={detail.inn || '---'} mono />
      {detail.kpp && <InfoRow icon={<Shield className="h-3.5 w-3.5" />} label={t('tenants.kpp')} value={detail.kpp} mono />}
      {detail.ogrn && <InfoRow icon={<Shield className="h-3.5 w-3.5" />} label={t('tenants.ogrn')} value={detail.ogrn} mono />}
      {detail.email && <InfoRow icon={<Mail className="h-3.5 w-3.5" />} label={t('tenants.email')} value={detail.email} />}
      {detail.phone && <InfoRow icon={<Phone className="h-3.5 w-3.5" />} label={t('tenants.phone')} value={detail.phone} />}
      {detail.legalAddress && <InfoRow icon={<MapPin className="h-3.5 w-3.5" />} label={t('tenants.legalAddress')} value={detail.legalAddress} />}
      <InfoRow icon={<Calendar className="h-3.5 w-3.5" />} label={t('tenants.registered')} value={detail.createdAt ? formatDate(detail.createdAt) : '---'} />
      {detail.subscriptionEndDate && (
        <InfoRow icon={<Clock className="h-3.5 w-3.5" />} label={t('tenants.subscriptionEnd')} value={formatDate(detail.subscriptionEndDate)} />
      )}
    </div>

    {/* Actions */}
    <div className="border-t border-neutral-100 dark:border-neutral-800 pt-4 space-y-2">
      <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2">{t('tenants.actions')}</p>
      {detail.status === 'ACTIVE' ? (
        <button
          onClick={() => onStatusChange('SUSPENDED')}
          disabled={isMutating}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400 text-sm font-medium hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors disabled:opacity-50"
        >
          <Ban className="h-4 w-4" />
          {t('tenants.actionSuspend')}
        </button>
      ) : (
        <button
          onClick={() => onStatusChange('ACTIVE')}
          disabled={isMutating}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm font-medium hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors disabled:opacity-50"
        >
          <CheckCircle className="h-4 w-4" />
          {t('tenants.actionActivate')}
        </button>
      )}
      {detail.status !== 'CANCELLED' && (
        <button
          onClick={() => {
            if (window.confirm(t('tenants.confirmCancel'))) {
              onStatusChange('CANCELLED');
            }
          }}
          disabled={isMutating}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
        >
          <XCircle className="h-4 w-4" />
          {t('tenants.actionCancel')}
        </button>
      )}
    </div>
  </div>
);

/* ─── Info Row ─── */
const InfoRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}> = ({ icon, label, value, mono }) => (
  <div className="flex items-start gap-2.5">
    <span className="text-neutral-400 mt-0.5 shrink-0">{icon}</span>
    <div className="min-w-0">
      <p className="text-[10px] text-neutral-400 uppercase tracking-wider">{label}</p>
      <p className={cn('text-sm text-neutral-900 dark:text-neutral-100 break-words', mono && 'font-mono text-xs')}>{value}</p>
    </div>
  </div>
);

/** Standalone page with PageHeader (direct route access) */
const TenantManagementPage: React.FC = () => (
  <div className="animate-fade-in">
    <PageHeader
      title={t('tenants.title')}
      subtitle={t('tenants.subtitle')}
      breadcrumbs={[
        { label: t('navigation.items.dashboard'), href: '/' },
        { label: t('tenants.breadcrumbAdmin'), href: '/admin/dashboard' },
        { label: t('tenants.title') },
      ]}
    />
    <TenantManagementContent />
  </div>
);

export default TenantManagementPage;
