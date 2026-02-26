import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Plus,
  Search,
  ClipboardCheck,
  Package,
  XCircle,
  AlertTriangle,
  Clock,
  Trash2,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Modal } from '@/design-system/components/Modal';
import { FormField, Input, Select, Textarea, Checkbox } from '@/design-system/components/FormField';
import { qualityApi } from '@/api/quality';
import { formatDate } from '@/lib/format';
import { t } from '@/i18n';
import toast from 'react-hot-toast';
import type {
  MaterialInspection,
  MaterialInspectionResult,
  MaterialInspectionTestResult,
  CreateMaterialInspectionRequest,
} from '@/modules/quality/types';

const resultColorMap: Record<string, 'green' | 'red' | 'yellow'> = {
  accepted: 'green',
  rejected: 'red',
  conditional: 'yellow',
};

const getResultLabels = (): Record<string, string> => ({
  accepted: t('quality.materialInspection.resultAccepted'),
  rejected: t('quality.materialInspection.resultRejected'),
  conditional: t('quality.materialInspection.resultConditional'),
});

type TabId = 'all' | 'accepted' | 'rejected' | 'conditional';

const MaterialInspectionPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [resultFilter, setResultFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [form, setForm] = useState<{
    materialName: string;
    supplier: string;
    batchNumber: string;
    inspectorName: string;
    inspectionDate: string;
    testProtocolNumber: string;
    result: MaterialInspectionResult;
    notes: string;
    testResults: MaterialInspectionTestResult[];
  }>({
    materialName: '',
    supplier: '',
    batchNumber: '',
    inspectorName: '',
    inspectionDate: '',
    testProtocolNumber: '',
    result: 'accepted',
    notes: '',
    testResults: [],
  });

  const { data: inspectionsData, isLoading } = useQuery({
    queryKey: ['material-inspections'],
    queryFn: () => qualityApi.getMaterialInspections(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateMaterialInspectionRequest) =>
      qualityApi.createMaterialInspection(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material-inspections'] });
      toast.success(t('quality.materialInspection.toastCreated'));
      setShowModal(false);
      resetForm();
    },
    onError: () => {
      toast.error(t('quality.materialInspection.toastCreateError'));
    },
  });

  const inspections = inspectionsData?.content ?? [];

  const suppliers = useMemo(
    () => [...new Set(inspections.map((i) => i.supplier))],
    [inspections],
  );

  const filteredInspections = useMemo(() => {
    let filtered = inspections;
    if (activeTab !== 'all') filtered = filtered.filter((i) => i.result === activeTab);
    if (resultFilter) filtered = filtered.filter((i) => i.result === resultFilter);
    if (supplierFilter) filtered = filtered.filter((i) => i.supplier === supplierFilter);
    if (dateFrom) filtered = filtered.filter((i) => i.inspectionDate >= dateFrom);
    if (dateTo) filtered = filtered.filter((i) => i.inspectionDate <= dateTo);
    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.materialName.toLowerCase().includes(lower) ||
          i.supplier.toLowerCase().includes(lower) ||
          i.batchNumber.toLowerCase().includes(lower),
      );
    }
    return filtered;
  }, [inspections, activeTab, resultFilter, supplierFilter, dateFrom, dateTo, search]);

  const metrics = useMemo(() => {
    const total = inspections.length;
    const accepted = inspections.filter((i) => i.result === 'accepted').length;
    const rejected = inspections.filter((i) => i.result === 'rejected').length;
    const conditional = inspections.filter((i) => i.result === 'conditional').length;
    const acceptedPct = total > 0 ? ((accepted / total) * 100).toFixed(1) : '0';
    return { total, accepted, rejected, conditional, acceptedPct };
  }, [inspections]);

  const tabCounts = useMemo(
    () => ({
      all: inspections.length,
      accepted: metrics.accepted,
      rejected: metrics.rejected,
      conditional: metrics.conditional,
    }),
    [inspections.length, metrics],
  );

  const resetForm = () => {
    setForm({
      materialName: '',
      supplier: '',
      batchNumber: '',
      inspectorName: '',
      inspectionDate: '',
      testProtocolNumber: '',
      result: 'accepted',
      notes: '',
      testResults: [],
    });
  };

  const addTestResult = () => {
    setForm((prev) => ({
      ...prev,
      testResults: [
        ...prev.testResults,
        { parameter: '', value: '', standard: '', passed: true },
      ],
    }));
  };

  const removeTestResult = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      testResults: prev.testResults.filter((_, i) => i !== idx),
    }));
  };

  const updateTestResult = (idx: number, field: keyof MaterialInspectionTestResult, val: string | boolean) => {
    setForm((prev) => ({
      ...prev,
      testResults: prev.testResults.map((tr, i) =>
        i === idx ? { ...tr, [field]: val } : tr,
      ),
    }));
  };

  const handleCreate = () => {
    createMutation.mutate({
      materialName: form.materialName,
      supplier: form.supplier,
      batchNumber: form.batchNumber,
      inspectorName: form.inspectorName,
      inspectionDate: form.inspectionDate,
      testProtocolNumber: form.testProtocolNumber,
      result: form.result,
      notes: form.notes || undefined,
      testResults: form.testResults,
      projectId: '',
    });
  };

  const columns = useMemo<ColumnDef<MaterialInspection, unknown>[]>(() => {
    const resultLabels = getResultLabels();
    return [
      {
        accessorKey: 'materialName',
        header: t('quality.materialInspection.colMaterial'),
        size: 200,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">
              {row.original.materialName}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {row.original.projectName}
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'supplier',
        header: t('quality.materialInspection.colSupplier'),
        size: 160,
      },
      {
        accessorKey: 'batchNumber',
        header: t('quality.materialInspection.colBatch'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'inspectionDate',
        header: t('quality.materialInspection.colDate'),
        size: 110,
        cell: ({ getValue }) => (
          <span className="tabular-nums">{formatDate(getValue<string>())}</span>
        ),
      },
      {
        accessorKey: 'inspectorName',
        header: t('quality.materialInspection.colInspector'),
        size: 150,
      },
      {
        accessorKey: 'result',
        header: t('quality.materialInspection.colResult'),
        size: 130,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={resultColorMap}
            label={resultLabels[getValue<string>()]}
          />
        ),
      },
      {
        accessorKey: 'testProtocolNumber',
        header: t('quality.materialInspection.colProtocol'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400">
            {getValue<string>()}
          </span>
        ),
      },
    ];
  }, []);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('quality.materialInspection.title')}
        subtitle={t('quality.materialInspection.subtitle', {
          count: String(inspections.length),
        })}
        breadcrumbs={[
          { label: t('quality.materialInspection.breadcrumbHome'), href: '/' },
          { label: t('quality.materialInspection.breadcrumbQuality'), href: '/quality' },
          { label: t('quality.materialInspection.breadcrumbMaterialInspection') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => setShowModal(true)}>
            {t('quality.materialInspection.btnNewInspection')}
          </Button>
        }
        tabs={[
          { id: 'all', label: t('quality.materialInspection.tabAll'), count: tabCounts.all },
          { id: 'accepted', label: t('quality.materialInspection.tabAccepted'), count: tabCounts.accepted },
          { id: 'rejected', label: t('quality.materialInspection.tabRejected'), count: tabCounts.rejected },
          { id: 'conditional', label: t('quality.materialInspection.tabConditional'), count: tabCounts.conditional },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<Package size={16} />}
          label={t('quality.materialInspection.metricTotal')}
          value={metrics.total}
          loading={isLoading}
        />
        <MetricCard
          icon={<ClipboardCheck size={16} />}
          label={t('quality.materialInspection.metricAccepted')}
          value={metrics.accepted}
          subtitle={t('quality.materialInspection.trendPercent', { value: metrics.acceptedPct })}
          loading={isLoading}
        />
        <MetricCard
          icon={<XCircle size={16} />}
          label={t('quality.materialInspection.metricRejected')}
          value={metrics.rejected}
          loading={isLoading}
        />
        <MetricCard
          icon={<Clock size={16} />}
          label={t('quality.materialInspection.metricPending')}
          value={metrics.conditional}
          loading={isLoading}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('quality.materialInspection.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={[
            { value: '', label: t('quality.materialInspection.filterAllResults') },
            ...Object.entries(getResultLabels()).map(([v, l]) => ({ value: v, label: l })),
          ]}
          value={resultFilter}
          onChange={(e) => setResultFilter(e.target.value)}
          className="w-40"
        />
        <Select
          options={[
            { value: '', label: t('quality.materialInspection.filterAllSuppliers') },
            ...suppliers.map((s) => ({ value: s, label: s })),
          ]}
          value={supplierFilter}
          onChange={(e) => setSupplierFilter(e.target.value)}
          className="w-44"
        />
        <Input
          type="date"
          placeholder={t('quality.materialInspection.dateFrom')}
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="w-36"
        />
        <Input
          type="date"
          placeholder={t('quality.materialInspection.dateTo')}
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="w-36"
        />
      </div>

      {/* Table */}
      <DataTable<MaterialInspection>
        data={filteredInspections}
        columns={columns}
        loading={isLoading}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('quality.materialInspection.emptyTitle')}
        emptyDescription={t('quality.materialInspection.emptyDescription')}
      />

      {/* Create Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={t('quality.materialInspection.modalTitle')}
        description={t('quality.materialInspection.modalDescription')}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              {t('quality.materialInspection.btnCancel')}
            </Button>
            <Button onClick={handleCreate} loading={createMutation.isPending}>
              {t('quality.materialInspection.btnCreate')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('quality.materialInspection.labelMaterial')} required>
              <Input
                placeholder={t('quality.materialInspection.placeholderMaterial')}
                value={form.materialName}
                onChange={(e) => setForm((p) => ({ ...p, materialName: e.target.value }))}
              />
            </FormField>
            <FormField label={t('quality.materialInspection.labelSupplier')} required>
              <Input
                placeholder={t('quality.materialInspection.placeholderSupplier')}
                value={form.supplier}
                onChange={(e) => setForm((p) => ({ ...p, supplier: e.target.value }))}
              />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('quality.materialInspection.labelBatch')} required>
              <Input
                placeholder={t('quality.materialInspection.placeholderBatch')}
                value={form.batchNumber}
                onChange={(e) => setForm((p) => ({ ...p, batchNumber: e.target.value }))}
              />
            </FormField>
            <FormField label={t('quality.materialInspection.labelInspector')} required>
              <Input
                placeholder={t('quality.materialInspection.placeholderInspector')}
                value={form.inspectorName}
                onChange={(e) => setForm((p) => ({ ...p, inspectorName: e.target.value }))}
              />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('quality.materialInspection.labelDate')} required>
              <Input
                type="date"
                value={form.inspectionDate}
                onChange={(e) => setForm((p) => ({ ...p, inspectionDate: e.target.value }))}
              />
            </FormField>
            <FormField label={t('quality.materialInspection.labelProtocol')}>
              <Input
                placeholder={t('quality.materialInspection.placeholderProtocol')}
                value={form.testProtocolNumber}
                onChange={(e) =>
                  setForm((p) => ({ ...p, testProtocolNumber: e.target.value }))
                }
              />
            </FormField>
          </div>
          <FormField label={t('quality.materialInspection.labelResult')} required>
            <Select
              options={Object.entries(getResultLabels()).map(([v, l]) => ({
                value: v,
                label: l,
              }))}
              value={form.result}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  result: e.target.value as MaterialInspectionResult,
                }))
              }
            />
          </FormField>

          {/* Test Results */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                {t('quality.materialInspection.sectionTestResults')}
              </p>
              <Button variant="ghost" size="xs" onClick={addTestResult}>
                <Plus size={14} />
                {t('quality.materialInspection.addTestResult')}
              </Button>
            </div>
            {form.testResults.map((tr, idx) => (
              <div
                key={idx}
                className="grid grid-cols-[1fr_1fr_1fr_auto_auto] gap-2 mb-2 items-end"
              >
                <Input
                  placeholder={t('quality.materialInspection.testParameter')}
                  value={tr.parameter}
                  onChange={(e) => updateTestResult(idx, 'parameter', e.target.value)}
                />
                <Input
                  placeholder={t('quality.materialInspection.testValue')}
                  value={tr.value}
                  onChange={(e) => updateTestResult(idx, 'value', e.target.value)}
                />
                <Input
                  placeholder={t('quality.materialInspection.testStandard')}
                  value={tr.standard}
                  onChange={(e) => updateTestResult(idx, 'standard', e.target.value)}
                />
                <Checkbox
                  label={t('quality.materialInspection.testPassed')}
                  checked={tr.passed}
                  onChange={(e) => updateTestResult(idx, 'passed', e.target.checked)}
                />
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => removeTestResult(idx)}
                  aria-label={t('quality.materialInspection.removeTest')}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}
          </div>

          <FormField label={t('quality.materialInspection.labelNotes')}>
            <Textarea
              placeholder={t('quality.materialInspection.placeholderNotes')}
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              rows={2}
            />
          </FormField>
        </div>
      </Modal>
    </div>
  );
};

export default MaterialInspectionPage;
