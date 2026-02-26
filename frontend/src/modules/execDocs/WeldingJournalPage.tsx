import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  PlusCircle,
  Search,
  BookOpen,
  FolderKanban,
  Filter,
  Flame,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { DataTable } from '@/design-system/components/DataTable';
import { Button } from '@/design-system/components/Button';
import { Modal } from '@/design-system/components/Modal';
import { FormField, Input, Select } from '@/design-system/components/FormField';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { execDocsApi } from '@/api/execDocs';
import { projectsApi } from '@/api/projects';
import { formatDate } from '@/lib/format';
import { t } from '@/i18n';
import toast from 'react-hot-toast';
import type { WeldingJournalEntry, WeldingResult } from './types';

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------

const resultColorMap: Record<string, string> = {
  pass: 'green',
  fail: 'red',
};

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

const WeldingJournalPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [projectId, setProjectId] = useState('');
  const [resultFilter, setResultFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  // Form state
  const [formDate, setFormDate] = useState('');
  const [weldNumber, setWeldNumber] = useState('');
  const [welderName, setWelderName] = useState('');
  const [welderCertificate, setWelderCertificate] = useState('');
  const [jointType, setJointType] = useState('');
  const [material, setMaterial] = useState('');
  const [electrode, setElectrode] = useState('');
  const [inspectionMethod, setInspectionMethod] = useState('');
  const [result, setResult] = useState<WeldingResult>('pass');

  const { data: projects } = useQuery({
    queryKey: ['projects-select'],
    queryFn: () => projectsApi.getProjects({ size: 200 }),
  });

  const projectOptions = (projects?.content ?? []).map((p) => ({
    value: p.id,
    label: p.name,
  }));

  const { data: entries, isLoading } = useQuery<WeldingJournalEntry[]>({
    queryKey: ['welding-entries', projectId],
    queryFn: () => execDocsApi.getWeldingJournalEntries(projectId),
    enabled: !!projectId,
  });

  const items = entries ?? [];

  const filteredItems = useMemo(() => {
    let filtered = items;
    if (resultFilter) {
      filtered = filtered.filter((e) => e.result === resultFilter);
    }
    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.weldNumber.toLowerCase().includes(lower) ||
          e.welderName.toLowerCase().includes(lower) ||
          e.material.toLowerCase().includes(lower) ||
          e.electrode.toLowerCase().includes(lower),
      );
    }
    return filtered;
  }, [items, resultFilter, search]);

  const createMutation = useMutation({
    mutationFn: () =>
      execDocsApi.createWeldingJournalEntry({
        date: formDate,
        weldNumber,
        welderName,
        welderCertificate,
        jointType,
        material,
        electrode,
        inspectionMethod,
        result,
        projectId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['welding-entries', projectId] });
      toast.success(t('execDocs.welding.toastCreated'));
      closeModal();
    },
    onError: () => toast.error(t('execDocs.welding.toastCreateError')),
  });

  const closeModal = useCallback(() => {
    setShowCreate(false);
    setFormDate('');
    setWeldNumber('');
    setWelderName('');
    setWelderCertificate('');
    setJointType('');
    setMaterial('');
    setElectrode('');
    setInspectionMethod('');
    setResult('pass');
  }, []);

  const handleCreate = useCallback(() => {
    if (!formDate) {
      toast.error(t('execDocs.welding.validationDate'));
      return;
    }
    if (!weldNumber.trim()) {
      toast.error(t('execDocs.welding.validationWeldNumber'));
      return;
    }
    createMutation.mutate();
  }, [formDate, weldNumber, createMutation]);

  const columns = useMemo<ColumnDef<WeldingJournalEntry, unknown>[]>(
    () => [
      {
        accessorKey: 'date',
        header: t('execDocs.welding.colDate'),
        size: 110,
        cell: ({ getValue }) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100 tabular-nums text-sm">
            {formatDate(getValue<string>())}
          </span>
        ),
      },
      {
        accessorKey: 'weldNumber',
        header: t('execDocs.welding.colWeldNumber'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="font-mono text-xs text-neutral-600 dark:text-neutral-400">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'welderName',
        header: t('execDocs.welding.colWelderName'),
        size: 180,
        cell: ({ getValue }) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100 text-sm">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'welderCertificate',
        header: t('execDocs.welding.colCertificate'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'jointType',
        header: t('execDocs.welding.colJointType'),
        size: 130,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300 text-sm">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'material',
        header: t('execDocs.welding.colMaterial'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="text-neutral-600 dark:text-neutral-400 text-sm">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'electrode',
        header: t('execDocs.welding.colElectrode'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="text-neutral-600 dark:text-neutral-400 text-sm">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'inspectionMethod',
        header: t('execDocs.welding.colInspectionMethod'),
        size: 150,
        cell: ({ getValue }) => (
          <span className="text-neutral-500 dark:text-neutral-400 text-sm">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'result',
        header: t('execDocs.welding.colResult'),
        size: 120,
        cell: ({ getValue }) => {
          const res = getValue<WeldingResult>();
          return (
            <StatusBadge
              status={res}
              colorMap={resultColorMap}
              label={t(`execDocs.welding.result${res.charAt(0).toUpperCase() + res.slice(1)}`)}
            />
          );
        },
      },
    ],
    [],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('execDocs.welding.title')}
        subtitle={t('execDocs.welding.subtitle')}
        breadcrumbs={[
          { label: t('execDocs.breadcrumbHome'), href: '/' },
          { label: t('execDocs.welding.breadcrumb') },
        ]}
        actions={
          projectId ? (
            <Button size="sm" onClick={() => setShowCreate(true)}>
              <PlusCircle size={14} className="mr-1" />
              {t('execDocs.welding.actionCreate')}
            </Button>
          ) : null
        }
      />

      {/* Selectors and filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <FolderKanban size={16} className="text-neutral-400" />
          <div className="w-64">
            <Select
              options={projectOptions}
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              placeholder={t('execDocs.welding.selectProject')}
            />
          </div>
        </div>
        {projectId && (
          <>
            <div className="relative flex-1 max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <Input
                placeholder={t('execDocs.welding.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-neutral-400" />
              <div className="w-36">
                <Select
                  options={[
                    { value: '', label: t('common.all') },
                    { value: 'pass', label: t('execDocs.welding.resultPass') },
                    { value: 'fail', label: t('execDocs.welding.resultFail') },
                  ]}
                  value={resultFilter}
                  onChange={(e) => setResultFilter(e.target.value)}
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Table or empty state */}
      {projectId ? (
        <DataTable<WeldingJournalEntry>
          data={filteredItems}
          columns={columns}
          loading={isLoading}
          enableColumnVisibility
          enableDensityToggle
          enableExport
          pageSize={20}
          emptyTitle={t('execDocs.welding.emptyTitle')}
          emptyDescription={t('execDocs.welding.emptyDescription')}
        />
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BookOpen size={48} className="text-neutral-300 dark:text-neutral-600 mb-4" />
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">
            {t('execDocs.welding.selectProjectHint')}
          </p>
        </div>
      )}

      {/* Create Entry Modal */}
      <Modal
        open={showCreate}
        onClose={closeModal}
        title={t('execDocs.welding.modalCreateTitle')}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('execDocs.welding.fieldDate')} required>
              <Input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
              />
            </FormField>
            <FormField label={t('execDocs.welding.fieldWeldNumber')} required>
              <Input
                value={weldNumber}
                onChange={(e) => setWeldNumber(e.target.value)}
                placeholder={t('execDocs.welding.placeholderWeldNumber')}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('execDocs.welding.fieldWelderName')}>
              <Input
                value={welderName}
                onChange={(e) => setWelderName(e.target.value)}
                placeholder={t('execDocs.welding.placeholderWelderName')}
              />
            </FormField>
            <FormField label={t('execDocs.welding.fieldCertificate')}>
              <Input
                value={welderCertificate}
                onChange={(e) => setWelderCertificate(e.target.value)}
                placeholder={t('execDocs.welding.placeholderCertificate')}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('execDocs.welding.fieldJointType')}>
              <Input
                value={jointType}
                onChange={(e) => setJointType(e.target.value)}
                placeholder={t('execDocs.welding.placeholderJointType')}
              />
            </FormField>
            <FormField label={t('execDocs.welding.fieldMaterial')}>
              <Input
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                placeholder={t('execDocs.welding.placeholderMaterial')}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('execDocs.welding.fieldElectrode')}>
              <Input
                value={electrode}
                onChange={(e) => setElectrode(e.target.value)}
                placeholder={t('execDocs.welding.placeholderElectrode')}
              />
            </FormField>
            <FormField label={t('execDocs.welding.fieldInspectionMethod')}>
              <Input
                value={inspectionMethod}
                onChange={(e) => setInspectionMethod(e.target.value)}
                placeholder={t('execDocs.welding.placeholderInspectionMethod')}
              />
            </FormField>
          </div>

          <FormField label={t('execDocs.welding.fieldResult')}>
            <Select
              options={[
                { value: 'pass', label: t('execDocs.welding.resultPass') },
                { value: 'fail', label: t('execDocs.welding.resultFail') },
              ]}
              value={result}
              onChange={(e) => setResult(e.target.value as WeldingResult)}
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={closeModal}>
              {t('common.cancel')}
            </Button>
            <Button loading={createMutation.isPending} onClick={handleCreate}>
              <Flame size={14} className="mr-1" />
              {t('execDocs.welding.actionCreate')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default WeldingJournalPage;
