import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, ShieldX, Trash2 } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Modal } from '@/design-system/components/Modal';
import { FormField, Input } from '@/design-system/components/FormField';
import { kepApi } from './api';
import { t } from '@/i18n';
import { formatDate } from '@/lib/format';
import type { MchDDocument, MchDStatus, CreateMchDRequest } from './types';
import toast from 'react-hot-toast';

type TabId = 'all' | 'active' | 'expired' | 'revoked';

const tp = (k: string) => t(`kep.mchd.${k}`);

const statusColorMap: Record<MchDStatus, string> = {
  ACTIVE: 'green',
  EXPIRED: 'red',
  REVOKED: 'gray',
  SUSPENDED: 'orange',
};

const emptyForm: CreateMchDRequest = {
  number: '',
  principalInn: '',
  principalName: '',
  representativeInn: '',
  representativeName: '',
  scope: '',
  validFrom: '',
  validTo: '',
  notes: '',
};

export default function MchDListPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [showRevoke, setShowRevoke] = useState<MchDDocument | null>(null);
  const [form, setForm] = useState<CreateMchDRequest>(emptyForm);

  const { data, isLoading } = useQuery({
    queryKey: ['mchd-list'],
    queryFn: () => kepApi.getMchDList({ page: 0, size: 200 }),
  });

  const items = data?.content ?? [];

  const filtered = useMemo(() => {
    if (activeTab === 'active') return items.filter((i) => i.status === 'ACTIVE');
    if (activeTab === 'expired') return items.filter((i) => i.status === 'EXPIRED');
    if (activeTab === 'revoked') return items.filter((i) => i.status === 'REVOKED' || i.status === 'SUSPENDED');
    return items;
  }, [items, activeTab]);

  const activeCount = items.filter((i) => i.status === 'ACTIVE').length;
  const expiredCount = items.filter((i) => i.status === 'EXPIRED').length;

  const createMutation = useMutation({
    mutationFn: (data: CreateMchDRequest) => kepApi.createMchD(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mchd-list'] });
      setShowCreate(false);
      setForm(emptyForm);
      toast.success(tp('createSuccess'));
    },
    onError: () => toast.error(tp('createError')),
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => kepApi.revokeMchD(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mchd-list'] });
      setShowRevoke(null);
      toast.success(tp('revokeSuccess'));
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => kepApi.deleteMchD(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mchd-list'] });
      toast.success(tp('deleteSuccess'));
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const setField = useCallback(<K extends keyof CreateMchDRequest>(key: K, value: CreateMchDRequest[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const tabs = useMemo(() => [
    { id: 'all' as TabId, label: tp('tabAll'), count: items.length },
    { id: 'active' as TabId, label: tp('tabActive'), count: activeCount },
    { id: 'expired' as TabId, label: tp('tabExpired'), count: expiredCount },
    { id: 'revoked' as TabId, label: tp('tabRevoked') },
  ], [items.length, activeCount, expiredCount]);

  const columns = useMemo<ColumnDef<MchDDocument>[]>(() => [
    {
      accessorKey: 'number',
      header: tp('colNumber'),
      size: 140,
      cell: ({ getValue }) => <span className="font-mono font-medium">{getValue() as string}</span>,
    },
    {
      accessorKey: 'principalName',
      header: tp('colPrincipal'),
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-sm">{row.original.principalName}</div>
          <div className="text-xs text-gray-500">{tp('inn')}: {row.original.principalInn}</div>
        </div>
      ),
    },
    {
      accessorKey: 'representativeName',
      header: tp('colRepresentative'),
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-sm">{row.original.representativeName}</div>
          <div className="text-xs text-gray-500">{tp('inn')}: {row.original.representativeInn}</div>
        </div>
      ),
    },
    {
      accessorKey: 'scope',
      header: tp('colScope'),
      size: 200,
      cell: ({ getValue }) => {
        const v = getValue() as string;
        return <span className="text-sm">{v && v.length > 60 ? v.substring(0, 60) + '...' : v || '—'}</span>;
      },
    },
    {
      accessorKey: 'status',
      header: tp('colStatus'),
      size: 120,
      cell: ({ row }) => <StatusBadge status={row.original.status} colorMap={statusColorMap} />,
    },
    {
      accessorKey: 'validTo',
      header: tp('colValidTo'),
      size: 120,
      cell: ({ getValue }) => formatDate(getValue() as string),
    },
    {
      id: 'actions',
      header: '',
      size: 100,
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          {row.original.status === 'ACTIVE' && (
            <Button size="sm" variant="outline" onClick={() => setShowRevoke(row.original)}>
              <ShieldX size={14} />
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => deleteMutation.mutate(row.original.id)}>
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    },
  ], [deleteMutation]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={tp('title')}
        subtitle={tp('subtitle')}
        breadcrumbs={[
          { label: t('kep.certificates.breadcrumbHome'), href: '/' },
          { label: t('kep.certificates.breadcrumbKep'), href: '/kep/certificates' },
          { label: tp('breadcrumb') },
        ]}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
        actions={
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus size={14} className="mr-1" /> {tp('create')}
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard label={tp('metricTotal')} value={String(items.length)} loading={isLoading} />
        <MetricCard label={tp('metricActive')} value={String(activeCount)} loading={isLoading} />
        <MetricCard label={tp('metricExpired')} value={String(expiredCount)} loading={isLoading} />
      </div>

      <DataTable columns={columns} data={filtered} loading={isLoading} />

      {/* Create MChD modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title={tp('createTitle')} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label={tp('fieldNumber')} required>
              <Input value={form.number} onChange={(e) => setField('number', e.target.value)} placeholder={tp('numberPlaceholder')} />
            </FormField>
            <div />
            <FormField label={tp('fieldPrincipalName')} required>
              <Input value={form.principalName} onChange={(e) => setField('principalName', e.target.value)} />
            </FormField>
            <FormField label={tp('fieldPrincipalInn')} required>
              <Input value={form.principalInn} onChange={(e) => setField('principalInn', e.target.value)} placeholder="1234567890" />
            </FormField>
            <FormField label={tp('fieldRepresentativeName')} required>
              <Input value={form.representativeName} onChange={(e) => setField('representativeName', e.target.value)} />
            </FormField>
            <FormField label={tp('fieldRepresentativeInn')} required>
              <Input value={form.representativeInn} onChange={(e) => setField('representativeInn', e.target.value)} placeholder="1234567890" />
            </FormField>
            <FormField label={tp('fieldValidFrom')} required>
              <Input type="date" value={form.validFrom} onChange={(e) => setField('validFrom', e.target.value)} />
            </FormField>
            <FormField label={tp('fieldValidTo')} required>
              <Input type="date" value={form.validTo} onChange={(e) => setField('validTo', e.target.value)} />
            </FormField>
          </div>
          <FormField label={tp('fieldScope')}>
            <textarea
              className="w-full rounded-md border border-gray-300 p-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
              rows={3}
              value={form.scope}
              onChange={(e) => setField('scope', e.target.value)}
              placeholder={tp('scopePlaceholder')}
            />
          </FormField>
          <FormField label={tp('fieldNotes')}>
            <Input value={form.notes ?? ''} onChange={(e) => setField('notes', e.target.value)} />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCreate(false)}>{t('common.cancel')}</Button>
            <Button
              onClick={() => createMutation.mutate(form)}
              disabled={!form.number || !form.principalInn || !form.representativeInn || !form.validFrom || !form.validTo || createMutation.isPending}
            >
              {tp('createConfirm')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Revoke modal */}
      <Modal open={!!showRevoke} onClose={() => setShowRevoke(null)} title={tp('revokeTitle')}>
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {tp('revokeDescription')} <strong>{showRevoke?.number}</strong>?
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowRevoke(null)}>{t('common.cancel')}</Button>
            <Button
              variant="danger"
              onClick={() => showRevoke && revokeMutation.mutate(showRevoke.id)}
              disabled={revokeMutation.isPending}
            >
              {tp('revokeConfirm')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
