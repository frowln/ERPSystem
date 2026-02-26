import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Plus,
  Search,
  HardHat,
  Package,
  AlertTriangle,
  RotateCcw,
  Clock,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Button } from '@/design-system/components/Button';
import { Modal } from '@/design-system/components/Modal';
import { FormField, Input, Select } from '@/design-system/components/FormField';
import { safetyApi } from '@/api/safety';
import { formatDate } from '@/lib/format';
import { t } from '@/i18n';
import toast from 'react-hot-toast';
import type { PpeItem, PpeIssue, PpeIssueStatus } from './types';

type TabId = 'issued' | 'returned' | 'written_off';

const categoryColorMap: Record<string, 'blue' | 'green' | 'orange' | 'purple' | 'cyan' | 'yellow'> = {
  head: 'blue',
  body: 'green',
  hands: 'orange',
  feet: 'purple',
  eyes: 'cyan',
  respiratory: 'yellow',
};

const conditionColorMap: Record<string, 'green' | 'blue' | 'yellow' | 'red'> = {
  new: 'green',
  good: 'blue',
  worn: 'yellow',
  damaged: 'red',
};

const issueStatusColorMap: Record<string, 'blue' | 'green' | 'gray'> = {
  issued: 'blue',
  returned: 'green',
  written_off: 'gray',
};

const getCategoryLabels = (): Record<string, string> => ({
  head: t('safety.ppe.categoryHead'),
  body: t('safety.ppe.categoryBody'),
  hands: t('safety.ppe.categoryHands'),
  feet: t('safety.ppe.categoryFeet'),
  eyes: t('safety.ppe.categoryEyes'),
  respiratory: t('safety.ppe.categoryRespiratory'),
});

const getConditionLabels = (): Record<string, string> => ({
  new: t('safety.ppe.conditionNew'),
  good: t('safety.ppe.conditionGood'),
  worn: t('safety.ppe.conditionWorn'),
  damaged: t('safety.ppe.conditionDamaged'),
});

const getIssueStatusLabels = (): Record<string, string> => ({
  issued: t('safety.ppe.statusIssued'),
  returned: t('safety.ppe.statusReturned'),
  written_off: t('safety.ppe.statusWrittenOff'),
});

function isExpiringSoon(dateStr?: string): boolean {
  if (!dateStr) return false;
  const expiry = new Date(dateStr);
  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  return expiry > now && expiry <= thirtyDaysFromNow;
}

function isExpired(dateStr?: string): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

const PpeManagementPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('issued');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState('');

  // Issue form
  const [issuePpeItemId, setIssuePpeItemId] = useState('');
  const [issueEmployeeName, setIssueEmployeeName] = useState('');
  const [issueSize, setIssueSize] = useState('');
  const [issueQuantity, setIssueQuantity] = useState('1');

  // Return form
  const [returnStatus, setReturnStatus] = useState<'returned' | 'written_off'>('returned');

  const { data: inventoryData, isLoading: inventoryLoading } = useQuery({
    queryKey: ['safety-ppe-inventory'],
    queryFn: () => safetyApi.getPpeInventory(),
  });

  const { data: issuesData, isLoading: issuesLoading } = useQuery({
    queryKey: ['safety-ppe-issues'],
    queryFn: () => safetyApi.getPpeIssues(),
  });

  const inventory = inventoryData?.content ?? [];
  const issues = issuesData?.content ?? [];

  const issueMutation = useMutation({
    mutationFn: safetyApi.issuePpe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safety-ppe-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['safety-ppe-issues'] });
      toast.success(t('safety.ppe.toastIssued'));
      setIssueModalOpen(false);
      setIssuePpeItemId('');
      setIssueEmployeeName('');
      setIssueSize('');
      setIssueQuantity('1');
    },
    onError: () => {
      toast.error(t('safety.ppe.toastIssueError'));
    },
  });

  const returnMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'returned' | 'written_off' }) =>
      safetyApi.returnPpe(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safety-ppe-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['safety-ppe-issues'] });
      toast.success(t('safety.ppe.toastReturned'));
      setReturnModalOpen(false);
      setSelectedIssueId('');
    },
    onError: () => {
      toast.error(t('safety.ppe.toastReturnError'));
    },
  });

  // Metrics
  const metrics = useMemo(() => {
    const lowStock = inventory.filter((i) => i.quantity < i.minQuantity).length;
    const issuedCount = issues.filter((i) => i.status === 'issued').length;
    const writtenOff = issues.filter((i) => i.status === 'written_off').length;
    const expiringSoonCount = inventory.filter((i) => isExpiringSoon(i.expirationDate)).length;
    const expiredCount = inventory.filter((i) => isExpired(i.expirationDate)).length;
    return { total: inventory.length, lowStock, issued: issuedCount, writtenOff, expiringSoon: expiringSoonCount, expired: expiredCount };
  }, [inventory, issues]);

  // Filter issues by tab (status)
  const issuedItems = useMemo(() => issues.filter((i) => i.status === 'issued'), [issues]);
  const returnedItems = useMemo(() => issues.filter((i) => i.status === 'returned'), [issues]);
  const writtenOffItems = useMemo(() => issues.filter((i) => i.status === 'written_off'), [issues]);

  const currentTabData = useMemo(() => {
    const dataMap: Record<TabId, PpeIssue[]> = {
      issued: issuedItems,
      returned: returnedItems,
      written_off: writtenOffItems,
    };
    let filtered = dataMap[activeTab];
    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.employeeName.toLowerCase().includes(lower) ||
          i.ppeItemName.toLowerCase().includes(lower),
      );
    }
    return filtered;
  }, [activeTab, issuedItems, returnedItems, writtenOffItems, search]);

  const categoryFilterOptions = [
    { value: '', label: t('safety.ppe.filterAllCategories') },
    ...Object.entries(getCategoryLabels()).map(([v, l]) => ({ value: v, label: l })),
  ];

  const issueColumns = useMemo<ColumnDef<PpeIssue, unknown>[]>(
    () => [
      {
        accessorKey: 'employeeName',
        header: t('safety.ppe.colEmployee'),
        size: 200,
        cell: ({ getValue }) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'ppeItemName',
        header: t('safety.ppe.colItem'),
        size: 200,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'size',
        header: t('safety.ppe.colSize'),
        size: 80,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-700 dark:text-neutral-300">
            {getValue<string>() || '\u2014'}
          </span>
        ),
      },
      {
        accessorKey: 'issuedDate',
        header: t('safety.ppe.colIssuedDate'),
        size: 130,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-700 dark:text-neutral-300">
            {formatDate(getValue<string>())}
          </span>
        ),
      },
      {
        accessorKey: 'returnDate',
        header: t('safety.ppe.colReturnDate'),
        size: 130,
        cell: ({ getValue }) => {
          const val = getValue<string | undefined>();
          return (
            <span className="tabular-nums text-neutral-700 dark:text-neutral-300">
              {val ? formatDate(val) : '\u2014'}
            </span>
          );
        },
      },
      {
        accessorKey: 'condition',
        header: t('safety.ppe.colCondition'),
        size: 120,
        cell: ({ getValue }) => {
          const val = getValue<string | undefined>();
          if (!val) return <span className="text-neutral-400">{'\u2014'}</span>;
          return (
            <StatusBadge
              status={val}
              colorMap={conditionColorMap}
              label={getConditionLabels()[val] ?? val}
            />
          );
        },
      },
      {
        accessorKey: 'status',
        header: t('safety.ppe.colStatus'),
        size: 130,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={issueStatusColorMap}
            label={getIssueStatusLabels()[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        id: 'actions',
        header: '',
        size: 100,
        cell: ({ row }) =>
          row.original.status === 'issued' ? (
            <Button
              variant="ghost"
              size="xs"
              iconLeft={<RotateCcw size={14} />}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedIssueId(row.original.id);
                setReturnModalOpen(true);
              }}
            >
              {t('safety.ppe.btnReturn')}
            </Button>
          ) : null,
      },
    ],
    [],
  );

  const ppeItemOptions = inventory.map((i) => ({ value: i.id, label: i.name }));

  // Expiration alerts
  const expiringItems = useMemo(
    () => inventory.filter((i) => isExpiringSoon(i.expirationDate) || isExpired(i.expirationDate)),
    [inventory],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('safety.ppe.title')}
        subtitle={t('safety.ppe.subtitle')}
        breadcrumbs={[
          { label: t('safety.ppe.breadcrumbHome'), href: '/' },
          { label: t('safety.ppe.breadcrumbSafety'), href: '/safety' },
          { label: t('safety.ppe.breadcrumbPpe') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => setIssueModalOpen(true)}>
            {t('safety.ppe.btnIssue')}
          </Button>
        }
        tabs={[
          { id: 'issued', label: t('safety.ppe.tabIssued'), count: issuedItems.length },
          { id: 'returned', label: t('safety.ppe.tabReturned'), count: returnedItems.length },
          { id: 'written_off', label: t('safety.ppe.tabWrittenOff'), count: writtenOffItems.length },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <MetricCard icon={<Package size={18} />} label={t('safety.ppe.metricTotal')} value={metrics.total} />
        <MetricCard
          icon={<AlertTriangle size={18} />}
          label={t('safety.ppe.metricLowStock')}
          value={metrics.lowStock}
          trend={metrics.lowStock > 0 ? { direction: 'down', value: `${metrics.lowStock}` } : undefined}
        />
        <MetricCard icon={<HardHat size={18} />} label={t('safety.ppe.metricIssued')} value={metrics.issued} />
        <MetricCard
          icon={<RotateCcw size={18} />}
          label={t('safety.ppe.metricWrittenOff')}
          value={metrics.writtenOff}
        />
        <MetricCard
          icon={<Clock size={18} />}
          label={t('safety.ppe.metricExpiring')}
          value={metrics.expiringSoon + metrics.expired}
          trend={
            metrics.expired > 0
              ? { direction: 'down', value: `${metrics.expired} ${t('safety.ppe.expiredLabel')}` }
              : metrics.expiringSoon > 0
                ? { direction: 'down', value: `${metrics.expiringSoon} ${t('safety.ppe.expiringSoonLabel')}` }
                : undefined
          }
        />
      </div>

      {/* Expiration alerts */}
      {expiringItems.length > 0 && (
        <div className="mb-4 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-warning-600 dark:text-warning-400" />
            <h3 className="text-sm font-semibold text-warning-800 dark:text-warning-200">
              {t('safety.ppe.expirationAlertTitle')}
            </h3>
          </div>
          <ul className="space-y-1">
            {expiringItems.slice(0, 5).map((item) => (
              <li key={item.id} className="text-sm text-warning-700 dark:text-warning-300 flex items-center gap-2">
                <span className="font-medium">{item.name}</span>
                <span className="text-warning-500 dark:text-warning-400">
                  {isExpired(item.expirationDate)
                    ? t('safety.ppe.expiredOn', { date: formatDate(item.expirationDate!) })
                    : t('safety.ppe.expiresOn', { date: formatDate(item.expirationDate!) })}
                </span>
              </li>
            ))}
            {expiringItems.length > 5 && (
              <li className="text-xs text-warning-500 dark:text-warning-400">
                {t('safety.ppe.andMore', { count: String(expiringItems.length - 5) })}
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('safety.ppe.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <DataTable<PpeIssue>
        data={currentTabData}
        columns={issueColumns}
        loading={issuesLoading}
        enableExport
        pageSize={20}
        emptyTitle={t('safety.ppe.emptyIssues')}
        emptyDescription={t('safety.ppe.emptyIssuesDesc')}
      />

      {/* Issue Modal */}
      <Modal
        open={issueModalOpen}
        onClose={() => { setIssueModalOpen(false); setIssuePpeItemId(''); setIssueEmployeeName(''); setIssueSize(''); setIssueQuantity('1'); }}
        title={t('safety.ppe.issueModalTitle')}
        description={t('safety.ppe.issueModalDescription')}
        footer={
          <>
            <Button variant="outline" onClick={() => { setIssueModalOpen(false); setIssuePpeItemId(''); setIssueEmployeeName(''); setIssueSize(''); setIssueQuantity('1'); }}>
              {t('safety.ppe.btnCancel')}
            </Button>
            <Button
              onClick={() => issueMutation.mutate({
                ppeItemId: issuePpeItemId,
                employeeId: issueEmployeeName.replace(/\s/g, '-').toLowerCase(),
                employeeName: issueEmployeeName,
                size: issueSize || undefined,
                quantity: parseInt(issueQuantity, 10) || 1,
              })}
              loading={issueMutation.isPending}
              disabled={!issuePpeItemId || !issueEmployeeName}
            >
              {t('safety.ppe.btnConfirmIssue')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label={t('safety.ppe.labelPpeItem')} required>
            <Select
              options={ppeItemOptions}
              value={issuePpeItemId}
              onChange={(e) => setIssuePpeItemId(e.target.value)}
              placeholder={t('safety.ppe.placeholderPpeItem')}
            />
          </FormField>
          <FormField label={t('safety.ppe.labelEmployee')} required>
            <Input
              placeholder={t('safety.ppe.placeholderEmployee')}
              value={issueEmployeeName}
              onChange={(e) => setIssueEmployeeName(e.target.value)}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('safety.ppe.labelSize')}>
              <Input
                placeholder={t('safety.ppe.placeholderSize')}
                value={issueSize}
                onChange={(e) => setIssueSize(e.target.value)}
              />
            </FormField>
            <FormField label={t('safety.ppe.labelQuantity')}>
              <Input
                type="number"
                min="1"
                value={issueQuantity}
                onChange={(e) => setIssueQuantity(e.target.value)}
              />
            </FormField>
          </div>
        </div>
      </Modal>

      {/* Return Modal */}
      <Modal
        open={returnModalOpen}
        onClose={() => { setReturnModalOpen(false); setSelectedIssueId(''); }}
        title={t('safety.ppe.returnModalTitle')}
        description={t('safety.ppe.returnModalDescription')}
        footer={
          <>
            <Button variant="outline" onClick={() => { setReturnModalOpen(false); setSelectedIssueId(''); }}>
              {t('safety.ppe.btnCancel')}
            </Button>
            <Button
              onClick={() => returnMutation.mutate({ id: selectedIssueId, status: returnStatus })}
              loading={returnMutation.isPending}
            >
              {t('safety.ppe.btnConfirmReturn')}
            </Button>
          </>
        }
      >
        <FormField label={t('safety.ppe.labelReturnStatus')} required>
          <Select
            options={[
              { value: 'returned', label: t('safety.ppe.returnOption') },
              { value: 'written_off', label: t('safety.ppe.writeOffOption') },
            ]}
            value={returnStatus}
            onChange={(e) => setReturnStatus(e.target.value as 'returned' | 'written_off')}
          />
        </FormField>
      </Modal>
    </div>
  );
};

export default PpeManagementPage;
