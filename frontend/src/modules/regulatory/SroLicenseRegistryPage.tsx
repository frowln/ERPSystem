import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Plus,
  Search,
  Award,
  CheckCircle,
  AlertTriangle,
  Clock,
  Bell,
  BellOff,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { FormField } from '@/design-system/components/FormField';
import { Modal } from '@/design-system/components/Modal';
import { regulatoryApi } from '@/api/regulatory';
import { formatDate } from '@/lib/format';
import type { SroLicense, SroLicenseStatus } from './types';
import { t } from '@/i18n';

type TabId = 'all' | 'active' | 'expiring' | 'expired';

const sroStatusColorMap: Record<string, string> = {
  active: 'green',
  expiring: 'yellow',
  expired: 'red',
};

const SroLicenseRegistryPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    organizationName: '',
    sroType: '',
    certificateNumber: '',
    issueDate: '',
    expiryDate: '',
  });

  const { data: licenses = [], isLoading } = useQuery<SroLicense[]>({
    queryKey: ['sro-licenses'],
    queryFn: () => regulatoryApi.getSroLicenses(),
  });

  const createMutation = useMutation({
    mutationFn: (data: Omit<SroLicense, 'id'>) =>
      regulatoryApi.createSroLicense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sro-licenses'] });
      toast.success(t('regulatory.sroCreateSuccess'));
      setCreateOpen(false);
      setFormData({
        organizationName: '',
        sroType: '',
        certificateNumber: '',
        issueDate: '',
        expiryDate: '',
      });
    },
    onError: () => toast.error(t('regulatory.sroCreateError')),
  });

  const toggleNotifyMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      regulatoryApi.toggleSroNotification(id, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sro-licenses'] });
      toast.success(t('regulatory.sroNotifyToggled'));
    },
    onError: () => toast.error(t('regulatory.sroNotifyError')),
  });

  const filteredLicenses = useMemo(() => {
    let filtered = licenses;
    if (activeTab !== 'all')
      filtered = filtered.filter((l) => l.status === activeTab);
    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.organizationName.toLowerCase().includes(lower) ||
          l.certificateNumber.toLowerCase().includes(lower) ||
          l.sroType.toLowerCase().includes(lower),
      );
    }
    return filtered;
  }, [licenses, activeTab, search]);

  const metrics = useMemo(() => {
    const total = licenses.length;
    const active = licenses.filter((l) => l.status === 'active').length;
    const expiring = licenses.filter((l) => l.status === 'expiring').length;
    const expired = licenses.filter((l) => l.status === 'expired').length;
    return { total, active, expiring, expired };
  }, [licenses]);

  const tabCounts = useMemo(
    () => ({
      all: licenses.length,
      active: metrics.active,
      expiring: metrics.expiring,
      expired: metrics.expired,
    }),
    [licenses.length, metrics],
  );

  const getSroStatusLabel = useCallback((status: string): string => {
    const map: Record<string, string> = {
      active: t('regulatory.sroStatusActive'),
      expiring: t('regulatory.sroStatusExpiring'),
      expired: t('regulatory.sroStatusExpired'),
    };
    return map[status] ?? status;
  }, []);

  const columns = useMemo<ColumnDef<SroLicense, unknown>[]>(
    () => [
      {
        accessorKey: 'organizationName',
        header: t('regulatory.sroColOrganization'),
        size: 220,
        cell: ({ getValue }) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100 text-sm">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'sroType',
        header: t('regulatory.sroColType'),
        size: 180,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300 text-sm">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'certificateNumber',
        header: t('regulatory.sroColCertificate'),
        size: 150,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'issueDate',
        header: t('regulatory.sroColIssueDate'),
        size: 110,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-700 dark:text-neutral-300 text-xs">
            {formatDate(getValue<string>())}
          </span>
        ),
      },
      {
        accessorKey: 'expiryDate',
        header: t('regulatory.sroColExpiryDate'),
        size: 110,
        cell: ({ row }) => {
          const date = row.original.expiryDate;
          const isExpired = new Date(date) < new Date();
          return (
            <span
              className={
                isExpired
                  ? 'text-danger-600 dark:text-danger-400 font-medium tabular-nums text-xs'
                  : 'tabular-nums text-neutral-700 dark:text-neutral-300 text-xs'
              }
            >
              {formatDate(date)}
            </span>
          );
        },
      },
      {
        accessorKey: 'status',
        header: t('regulatory.sroColStatus'),
        size: 120,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={sroStatusColorMap}
            label={getSroStatusLabel(getValue<string>())}
          />
        ),
      },
      {
        accessorKey: 'notifyEnabled',
        header: t('regulatory.sroColNotify'),
        size: 90,
        cell: ({ row }) => (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleNotifyMutation.mutate({
                id: row.original.id,
                enabled: !row.original.notifyEnabled,
              });
            }}
            className="p-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            title={
              row.original.notifyEnabled
                ? t('regulatory.sroNotifyOff')
                : t('regulatory.sroNotifyOn')
            }
          >
            {row.original.notifyEnabled ? (
              <Bell size={16} className="text-primary-500" />
            ) : (
              <BellOff size={16} className="text-neutral-400" />
            )}
          </button>
        ),
      },
    ],
    [getSroStatusLabel, toggleNotifyMutation],
  );

  const handleCreate = useCallback(() => {
    createMutation.mutate({
      organizationName: formData.organizationName,
      sroType: formData.sroType,
      certificateNumber: formData.certificateNumber,
      issueDate: formData.issueDate,
      expiryDate: formData.expiryDate,
      status: 'active' as SroLicenseStatus,
      notifyEnabled: true,
    });
  }, [createMutation, formData]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('regulatory.sroTitle')}
        subtitle={t('regulatory.sroSubtitle', {
          count: String(licenses.length),
        })}
        breadcrumbs={[
          { label: t('regulatory.breadcrumbHome'), href: '/' },
          {
            label: t('regulatory.breadcrumbRegulatory'),
            href: '/regulatory/dashboard',
          },
          { label: t('regulatory.sroBreadcrumb') },
        ]}
        actions={
          <Button
            iconLeft={<Plus size={16} />}
            onClick={() => setCreateOpen(true)}
          >
            {t('regulatory.sroBtnCreate')}
          </Button>
        }
        tabs={[
          { id: 'all', label: t('regulatory.tabAll'), count: tabCounts.all },
          {
            id: 'active',
            label: t('regulatory.sroTabActive'),
            count: tabCounts.active,
          },
          {
            id: 'expiring',
            label: t('regulatory.sroTabExpiring'),
            count: tabCounts.expiring,
          },
          {
            id: 'expired',
            label: t('regulatory.sroTabExpired'),
            count: tabCounts.expired,
          },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<Award size={18} />}
          label={t('regulatory.sroMetricTotal')}
          value={metrics.total}
        />
        <MetricCard
          icon={<CheckCircle size={18} />}
          label={t('regulatory.sroMetricActive')}
          value={metrics.active}
        />
        <MetricCard
          icon={<Clock size={18} />}
          label={t('regulatory.sroMetricExpiring')}
          value={metrics.expiring}
          trend={
            metrics.expiring > 0
              ? {
                  direction: 'down',
                  value: t('regulatory.trendNeedRenewal'),
                }
              : undefined
          }
        />
        <MetricCard
          icon={<AlertTriangle size={18} />}
          label={t('regulatory.sroMetricExpired')}
          value={metrics.expired}
        />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <Input
            placeholder={t('regulatory.sroSearchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <DataTable<SroLicense>
        data={filteredLicenses}
        columns={columns}
        loading={isLoading}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('regulatory.sroEmptyTitle')}
        emptyDescription={t('regulatory.sroEmptyDesc')}
      />

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title={t('regulatory.sroModalTitle')}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleCreate}
              loading={createMutation.isPending}
            >
              {t('common.create')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label={t('regulatory.sroFieldOrganization')} required>
            <Input
              value={formData.organizationName}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  organizationName: e.target.value,
                }))
              }
            />
          </FormField>
          <FormField label={t('regulatory.sroFieldType')} required>
            <Select
              options={[
                { value: 'SRO_CONSTRUCTION', label: t('regulatory.sroTypeSroConstruction') },
                { value: 'SRO_DESIGN', label: t('regulatory.sroTypeSroDesign') },
                { value: 'SRO_SURVEY', label: t('regulatory.sroTypeSroSurvey') },
                { value: 'LICENSE_HAZARDOUS', label: t('regulatory.sroTypeLicenseHazardous') },
                { value: 'LICENSE_FIRE', label: t('regulatory.sroTypeLicenseFire') },
                { value: 'LICENSE_NUCLEAR', label: t('regulatory.sroTypeLicenseNuclear') },
              ]}
              value={formData.sroType}
              onChange={(e) =>
                setFormData((p) => ({ ...p, sroType: e.target.value }))
              }
            />
          </FormField>
          <FormField label={t('regulatory.sroFieldCertificate')} required>
            <Input
              value={formData.certificateNumber}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  certificateNumber: e.target.value,
                }))
              }
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('regulatory.sroFieldIssueDate')} required>
              <Input
                type="date"
                value={formData.issueDate}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, issueDate: e.target.value }))
                }
              />
            </FormField>
            <FormField label={t('regulatory.sroFieldExpiryDate')} required>
              <Input
                type="date"
                value={formData.expiryDate}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    expiryDate: e.target.value,
                  }))
                }
              />
            </FormField>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SroLicenseRegistryPage;
