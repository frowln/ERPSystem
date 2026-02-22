import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Wand2,
  Play,
  Eye,
  FileCheck,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { MetricCard } from '@/design-system/components/MetricCard';
import { DataTable } from '@/design-system/components/DataTable';
import { Button } from '@/design-system/components/Button';
import { Modal } from '@/design-system/components/Modal';
import { FormField, Input, Select } from '@/design-system/components/FormField';
import { projectsApi } from '@/api/projects';
import { ks2PipelineApi, type VolumeEntry, type PipelinePreview } from '@/api/ks2Pipeline';
import { formatMoney } from '@/lib/format';
import { t } from '@/i18n';
import toast from 'react-hot-toast';

const tp = (k: string) => t(`ks2Pipeline.${k}`);

const Ks2PipelinePage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [projectId, setProjectId] = useState('');
  const [contractId, setContractId] = useState('');
  const [yearMonth, setYearMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<PipelinePreview | null>(null);

  const { data: projects } = useQuery({
    queryKey: ['projects-select'],
    queryFn: () => projectsApi.getProjects({ size: 200 }),
  });

  const projectOptions = (projects?.content ?? []).map((p) => ({
    value: p.id,
    label: p.name,
  }));

  // Get contracts for selected project
  const selectedProject = (projects?.content ?? []).find((p) => p.id === projectId);

  const { data: volumes, isLoading: volumesLoading } = useQuery({
    queryKey: ['ks2-pipeline-volumes', projectId, yearMonth],
    queryFn: () => ks2PipelineApi.getVolumes(projectId, yearMonth),
    enabled: !!projectId && !!yearMonth,
  });

  const volumeList = volumes ?? [];

  const metrics = useMemo(() => ({
    totalVolumes: volumeList.length,
    totalAmount: volumeList.reduce((sum, v) => sum + (v.total || 0), 0),
    uniqueWorks: new Set(volumeList.map((v) => v.workDescription)).size,
  }), [volumeList]);

  const previewMutation = useMutation({
    mutationFn: () => ks2PipelineApi.getPreview(projectId, contractId, yearMonth),
    onSuccess: (data) => {
      setPreviewData(data);
      setShowPreview(true);
    },
    onError: () => toast.error(tp('previewError')),
  });

  const generateMutation = useMutation({
    mutationFn: () => ks2PipelineApi.generate({ projectId, contractId, yearMonth }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ks2-documents'] });
      toast.success(tp('generateSuccess'));
      navigate('/ks2');
    },
    onError: () => toast.error(tp('generateError')),
  });

  const batchMutation = useMutation({
    mutationFn: () => ks2PipelineApi.batchGenerate(projectId, yearMonth),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['ks2-documents'] });
      toast.success(tp('batchSuccess').replace('{count}', String(Array.isArray(result) ? result.length : 0)));
      navigate('/ks2');
    },
    onError: () => toast.error(tp('batchError')),
  });

  const volumeColumns = [
    {
      accessorKey: 'workDescription',
      header: tp('colWork'),
      cell: ({ row }: { row: { original: VolumeEntry } }) => (
        <span className="font-medium text-sm">{row.original.workDescription}</span>
      ),
    },
    { accessorKey: 'unit', header: tp('colUnit') },
    {
      accessorKey: 'quantity',
      header: tp('colQuantity'),
      cell: ({ row }: { row: { original: VolumeEntry } }) => (
        <span className="font-mono">{row.original.quantity.toFixed(2)}</span>
      ),
    },
    {
      accessorKey: 'unitPrice',
      header: tp('colUnitPrice'),
      cell: ({ row }: { row: { original: VolumeEntry } }) =>
        row.original.unitPrice > 0 ? formatMoney(row.original.unitPrice) : <span className="text-yellow-600">{tp('noPricing')}</span>,
    },
    {
      accessorKey: 'total',
      header: tp('colTotal'),
      cell: ({ row }: { row: { original: VolumeEntry } }) =>
        row.original.total > 0 ? formatMoney(row.original.total) : '—',
    },
  ];

  const canGenerate = projectId && contractId && yearMonth;
  const canBatch = projectId && yearMonth;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={tp('title')}
        subtitle={tp('subtitle')}
        breadcrumbs={[
          { label: t('nav.home'), href: '/' },
          { label: tp('breadcrumbSite'), href: '/ks2' },
          { label: tp('breadcrumb') },
        ]}
      />

      {/* Pipeline Controls */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900 mb-6">
        <h3 className="text-lg font-semibold mb-4">{tp('sectionControls')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <FormField label={tp('fieldProject')} required>
            <Select
              options={projectOptions}
              value={projectId}
              onChange={(e) => { setProjectId(e.target.value); setContractId(''); }}
              placeholder={tp('projectPlaceholder')}
            />
          </FormField>
          <FormField label={tp('fieldContract')}>
            <Input
              value={contractId}
              onChange={(e) => setContractId(e.target.value)}
              placeholder={tp('contractPlaceholder')}
            />
          </FormField>
          <FormField label={tp('fieldPeriod')} required>
            <Input type="month" value={yearMonth} onChange={(e) => setYearMonth(e.target.value)} />
          </FormField>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => previewMutation.mutate()}
            disabled={!canGenerate}
            loading={previewMutation.isPending}
          >
            <Eye size={14} className="mr-1" /> {tp('previewBtn')}
          </Button>
          <Button
            size="sm"
            onClick={() => generateMutation.mutate()}
            disabled={!canGenerate}
            loading={generateMutation.isPending}
          >
            <Wand2 size={14} className="mr-1" /> {tp('generateBtn')}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => batchMutation.mutate()}
            disabled={!canBatch}
            loading={batchMutation.isPending}
          >
            <Play size={14} className="mr-1" /> {tp('batchBtn')}
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <MetricCard icon={<FileCheck size={18} />} label={tp('metricVolumes')} value={metrics.totalVolumes} />
        <MetricCard icon={<Wand2 size={18} />} label={tp('metricWorks')} value={metrics.uniqueWorks} />
        <MetricCard
          icon={<CheckCircle size={18} />}
          label={tp('metricAmount')}
          value={formatMoney(metrics.totalAmount)}
        />
      </div>

      {/* Volumes Table */}
      {projectId && (
        <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold">{tp('sectionVolumes')}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{tp('volumesSubtitle')}</p>
          </div>
          <DataTable
            columns={volumeColumns}
            data={volumeList}
            loading={volumesLoading}
          />
        </div>
      )}

      {/* Preview Modal */}
      <Modal open={showPreview} onClose={() => setShowPreview(false)} title={tp('previewModalTitle')}>
        {previewData && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3">
                <p className="text-xs text-gray-500">{tp('previewProject')}</p>
                <p className="font-medium">{previewData.projectName}</p>
              </div>
              <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3">
                <p className="text-xs text-gray-500">{tp('previewContract')}</p>
                <p className="font-medium">{previewData.contractNumber || '—'}</p>
              </div>
              <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3">
                <p className="text-xs text-gray-500">{tp('previewLines')}</p>
                <p className="font-medium text-lg">{previewData.lineCount}</p>
              </div>
              <div className="rounded-lg bg-primary-50 dark:bg-primary-900/20 p-3">
                <p className="text-xs text-gray-500">{tp('previewTotal')}</p>
                <p className="font-semibold text-lg text-primary-600">{formatMoney(previewData.estimatedTotal)}</p>
              </div>
            </div>

            {previewData.volumes.length > 0 && (
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 border-b">
                      <th className="pb-2">{tp('colWork')}</th>
                      <th className="pb-2 text-right">{tp('colQuantity')}</th>
                      <th className="pb-2 text-right">{tp('colTotal')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.volumes.map((v, i) => (
                      <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-2">{v.workDescription}</td>
                        <td className="py-2 text-right font-mono">{v.quantity.toFixed(2)} {v.unit}</td>
                        <td className="py-2 text-right">{formatMoney(v.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowPreview(false)}>{t('common.close')}</Button>
              <Button onClick={() => { setShowPreview(false); generateMutation.mutate(); }} loading={generateMutation.isPending}>
                <Wand2 size={14} className="mr-1" /> {tp('generateBtn')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Ks2PipelinePage;
