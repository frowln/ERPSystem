import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Eye, FileText, ClipboardCheck } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { hiddenWorkActApi, type HiddenWorkAct, type HiddenWorkActStatus } from '@/api/hiddenWorkActs';
import { formatDate } from '@/lib/format';
import { t } from '@/i18n';
import toast from 'react-hot-toast';

type TabId = 'all' | 'draft' | 'pending' | 'approved' | 'rejected';

const tp = (k: string) => t(`aosr.${k}`);

const statusColorMap: Record<HiddenWorkActStatus, string> = {
  DRAFT: 'gray',
  PENDING_INSPECTION: 'yellow',
  INSPECTED: 'blue',
  APPROVED: 'green',
  REJECTED: 'red',
};

export default function HiddenWorkActListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId') || undefined;
  const [activeTab, setActiveTab] = useState<TabId>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['hidden-work-acts', projectId],
    queryFn: () => hiddenWorkActApi.getAll({ projectId, size: 200 }),
  });

  const items = data?.content ?? [];

  const filtered = useMemo(() => {
    if (activeTab === 'draft') return items.filter((i) => i.status === 'DRAFT');
    if (activeTab === 'pending') return items.filter((i) => i.status === 'PENDING_INSPECTION' || i.status === 'INSPECTED');
    if (activeTab === 'approved') return items.filter((i) => i.status === 'APPROVED');
    if (activeTab === 'rejected') return items.filter((i) => i.status === 'REJECTED');
    return items;
  }, [items, activeTab]);

  const draftCount = items.filter((i) => i.status === 'DRAFT').length;
  const pendingCount = items.filter((i) => i.status === 'PENDING_INSPECTION' || i.status === 'INSPECTED').length;
  const approvedCount = items.filter((i) => i.status === 'APPROVED').length;
  const rejectedCount = items.filter((i) => i.status === 'REJECTED').length;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => hiddenWorkActApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hidden-work-acts'] });
      toast.success(tp('deleteSuccess'));
    },
    onError: () => toast.error(tp('deleteError')),
  });

  const tabs = useMemo(() => [
    { id: 'all' as TabId, label: tp('tabAll'), count: items.length },
    { id: 'draft' as TabId, label: tp('tabDraft'), count: draftCount },
    { id: 'pending' as TabId, label: tp('tabPending'), count: pendingCount },
    { id: 'approved' as TabId, label: tp('tabApproved'), count: approvedCount },
    { id: 'rejected' as TabId, label: tp('tabRejected'), count: rejectedCount },
  ], [items.length, draftCount, pendingCount, approvedCount, rejectedCount]);

  const columns = useMemo<ColumnDef<HiddenWorkAct>[]>(() => [
    {
      accessorKey: 'actNumber',
      header: tp('colNumber'),
      size: 120,
      cell: ({ getValue, row }) => (
        <button
          className="font-mono font-medium text-primary-600 hover:underline"
          onClick={() => navigate(`/pto/hidden-work-acts/${row.original.id}`)}
        >
          {(getValue() as string) || '—'}
        </button>
      ),
    },
    {
      accessorKey: 'date',
      header: tp('colDate'),
      size: 110,
      cell: ({ getValue }) => formatDate(getValue() as string),
    },
    {
      accessorKey: 'workDescription',
      header: tp('colDescription'),
      cell: ({ getValue }) => {
        const v = getValue() as string;
        return <span className="text-sm">{v && v.length > 80 ? v.substring(0, 80) + '...' : v}</span>;
      },
    },
    {
      accessorKey: 'location',
      header: tp('colLocation'),
      size: 160,
      cell: ({ getValue }) => <span className="text-sm">{(getValue() as string) || '—'}</span>,
    },
    {
      accessorKey: 'status',
      header: tp('colStatus'),
      size: 140,
      cell: ({ row }) => <StatusBadge status={row.original.status} colorMap={statusColorMap} />,
    },
    {
      accessorKey: 'inspectionDate',
      header: tp('colInspectionDate'),
      size: 120,
      cell: ({ getValue }) => {
        const v = getValue() as string | null;
        return v ? formatDate(v) : '—';
      },
    },
    {
      id: 'actions',
      header: '',
      size: 80,
      cell: ({ row }) => (
        <Button size="sm" variant="outline" onClick={() => navigate(`/pto/hidden-work-acts/${row.original.id}`)}>
          <Eye size={14} />
        </Button>
      ),
    },
  ], [navigate]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={tp('title')}
        subtitle={tp('subtitle')}
        breadcrumbs={[
          { label: t('nav.home'), href: '/' },
          { label: t('nav.pto-docs'), href: '/pto/documents' },
          { label: tp('breadcrumb') },
        ]}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
        actions={
          <Button size="sm" onClick={() => navigate('/pto/hidden-work-acts/new')}>
            <Plus size={14} className="mr-1" /> {tp('create')}
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard label={tp('metricTotal')} value={String(items.length)} loading={isLoading} />
        <MetricCard label={tp('metricDraft')} value={String(draftCount)} loading={isLoading} />
        <MetricCard label={tp('metricPending')} value={String(pendingCount)} loading={isLoading} />
        <MetricCard label={tp('metricApproved')} value={String(approvedCount)} loading={isLoading} />
      </div>

      <DataTable columns={columns} data={filtered} loading={isLoading} />
    </div>
  );
}
