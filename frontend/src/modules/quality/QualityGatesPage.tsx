import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader, MetricCard, DataTable, Button, StatusBadge, Modal, FormField } from '@/design-system/components';
import { ShieldCheck, CheckCircle, XCircle, AlertTriangle, RefreshCw, Plus } from 'lucide-react';
import { t } from '@/i18n';
import { qualityGatesApi } from '@/api/qualityGates';
import type { QualityGate, CreateQualityGateRequest, QualityGateStatus } from '@/api/qualityGates';
import { projectsApi } from '@/api/projects';
import type { ColumnDef } from '@tanstack/react-table';
import toast from 'react-hot-toast';

const STATUS_COLORS: Record<string, string> = {
  NOT_STARTED: 'gray',
  IN_PROGRESS: 'blue',
  BLOCKED: 'red',
  PASSED: 'green',
  FAILED: 'red',
};

function ProgressBar({ percent, color }: { percent: number; color: string }) {
  return (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div className={`h-2 rounded-full ${color}`} style={{ width: `${Math.min(percent, 100)}%` }} />
    </div>
  );
}

export default function QualityGatesPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<Partial<CreateQualityGateRequest>>({
    volumeThresholdPercent: 80,
    requiredDocuments: [],
    requiredQualityChecks: [],
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects-list'],
    queryFn: () => projectsApi.getProjects({ page: 0, size: 200 }).then(r => r.content),
  });

  const { data: gates = [], isLoading } = useQuery({
    queryKey: ['quality-gates', selectedProjectId],
    queryFn: () => qualityGatesApi.getForProject(selectedProjectId),
    enabled: !!selectedProjectId,
  });

  const evaluateAllMut = useMutation({
    mutationFn: (projectId: string) => qualityGatesApi.evaluateProject(projectId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quality-gates'] }),
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const evaluateMut = useMutation({
    mutationFn: (id: string) => qualityGatesApi.evaluate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quality-gates'] }),
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const createMut = useMutation({
    mutationFn: (data: CreateQualityGateRequest) => qualityGatesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quality-gates'] });
      setShowCreateModal(false);
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const filteredGates = activeTab === 'all'
    ? gates
    : gates.filter(g => {
        if (activeTab === 'blocked') return g.status === 'BLOCKED';
        if (activeTab === 'passed') return g.status === 'PASSED';
        if (activeTab === 'pending') return g.status === 'NOT_STARTED' || g.status === 'IN_PROGRESS';
        return true;
      });

  const tabs = [
    { id: 'all', label: t('qualityGates.tabAll'), count: gates.length || undefined },
    { id: 'pending', label: t('qualityGates.tabPending'), count: gates.filter(g => g.status === 'NOT_STARTED' || g.status === 'IN_PROGRESS').length || undefined },
    { id: 'blocked', label: t('qualityGates.tabBlocked'), count: gates.filter(g => g.status === 'BLOCKED').length || undefined },
    { id: 'passed', label: t('qualityGates.tabPassed'), count: gates.filter(g => g.status === 'PASSED').length || undefined },
  ];

  const columns: ColumnDef<QualityGate>[] = [
    { accessorKey: 'name', header: t('qualityGates.colName') },
    { accessorKey: 'wbsNodeName', header: t('qualityGates.colWbs') },
    {
      accessorKey: 'status',
      header: t('qualityGates.colStatus'),
      cell: ({ row }) => <StatusBadge status={row.original.status} colorMap={STATUS_COLORS} />,
    },
    {
      id: 'docProgress',
      header: t('qualityGates.colDocs'),
      cell: ({ row }) => (
        <div className="w-24">
          <div className="text-xs text-right mb-1">{row.original.docCompletionPercent}%</div>
          <ProgressBar percent={row.original.docCompletionPercent} color={row.original.docCompletionPercent >= 100 ? 'bg-green-500' : 'bg-blue-500'} />
        </div>
      ),
    },
    {
      id: 'qaProgress',
      header: t('qualityGates.colQuality'),
      cell: ({ row }) => (
        <div className="w-24">
          <div className="text-xs text-right mb-1">{row.original.qualityCompletionPercent}%</div>
          <ProgressBar percent={row.original.qualityCompletionPercent} color={row.original.qualityCompletionPercent >= 100 ? 'bg-green-500' : 'bg-yellow-500'} />
        </div>
      ),
    },
    {
      id: 'volProgress',
      header: t('qualityGates.colVolumes'),
      cell: ({ row }) => (
        <div className="w-24">
          <div className="text-xs text-right mb-1">{row.original.volumeCompletionPercent}%</div>
          <ProgressBar percent={row.original.volumeCompletionPercent} color={row.original.volumeCompletionPercent >= (row.original.volumeThresholdPercent ?? 80) ? 'bg-green-500' : 'bg-orange-500'} />
        </div>
      ),
    },
    {
      id: 'actions',
      header: t('common.actions'),
      cell: ({ row }) => (
        <Button variant="outline" size="sm" onClick={() => evaluateMut.mutate(row.original.id)} loading={evaluateMut.isPending}>
          <RefreshCw className="h-3 w-3 mr-1" /> {t('qualityGates.evaluateBtn')}
        </Button>
      ),
    },
  ];

  const passedCount = gates.filter(g => g.status === 'PASSED').length;
  const blockedCount = gates.filter(g => g.status === 'BLOCKED').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('qualityGates.title')}
        subtitle={t('qualityGates.subtitle')}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <div className="flex gap-2">
            {selectedProjectId && (
              <Button variant="outline" onClick={() => evaluateAllMut.mutate(selectedProjectId)} loading={evaluateAllMut.isPending}>
                <RefreshCw className="h-4 w-4 mr-1" /> {t('qualityGates.evaluateAllBtn')}
              </Button>
            )}
            <Button variant="primary" onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-1" /> {t('qualityGates.createBtn')}
            </Button>
          </div>
        }
      />

      <div className="flex gap-4 items-center">
        <FormField label={t('qualityGates.selectProject')}>
          <select
            className="border rounded px-3 py-2 min-w-[250px]"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
          >
            <option value="">{t('qualityGates.selectProjectPlaceholder')}</option>
            {projects.map((p: { id: string; name: string }) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </FormField>
      </div>

      {selectedProjectId && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard label={t('qualityGates.metricTotal')} value={gates.length} icon={<ShieldCheck className="h-5 w-5" />} />
            <MetricCard label={t('qualityGates.metricPassed')} value={passedCount} icon={<CheckCircle className="h-5 w-5" />} />
            <MetricCard label={t('qualityGates.metricBlocked')} value={blockedCount} icon={<XCircle className="h-5 w-5" />} />
            <MetricCard label={t('qualityGates.metricProgress')} value={gates.length > 0 ? `${Math.round((passedCount / gates.length) * 100)}%` : '0%'} icon={<AlertTriangle className="h-5 w-5" />} />
          </div>

          <DataTable columns={columns} data={filteredGates} loading={isLoading} />
        </>
      )}

      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title={t('qualityGates.createModalTitle')}>
        <div className="space-y-4">
          <FormField label={t('qualityGates.fieldName')} required>
            <input type="text" className="w-full border rounded px-3 py-2" value={createForm.name ?? ''} onChange={(e) => setCreateForm(f => ({ ...f, name: e.target.value }))} />
          </FormField>
          <FormField label={t('qualityGates.fieldWbsNode')} required>
            <input type="text" className="w-full border rounded px-3 py-2" value={createForm.wbsNodeId ?? ''} onChange={(e) => setCreateForm(f => ({ ...f, wbsNodeId: e.target.value }))} placeholder="UUID" />
          </FormField>
          <FormField label={t('qualityGates.fieldThreshold')}>
            <input type="number" className="w-full border rounded px-3 py-2" value={createForm.volumeThresholdPercent ?? 80} onChange={(e) => setCreateForm(f => ({ ...f, volumeThresholdPercent: Number(e.target.value) }))} min={0} max={100} />
          </FormField>
          <FormField label={t('qualityGates.fieldDescription')}>
            <textarea className="w-full border rounded px-3 py-2" rows={2} value={createForm.description ?? ''} onChange={(e) => setCreateForm(f => ({ ...f, description: e.target.value }))} />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>{t('common.cancel')}</Button>
            <Button
              variant="primary"
              loading={createMut.isPending}
              onClick={() => createMut.mutate({ ...createForm, projectId: selectedProjectId } as CreateQualityGateRequest)}
            >
              {t('common.create')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
