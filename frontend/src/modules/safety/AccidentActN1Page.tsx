import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Plus,
  Search,
  FileText,
  Download,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Button } from '@/design-system/components/Button';
import { Modal } from '@/design-system/components/Modal';
import { FormField, Input, Textarea, Select } from '@/design-system/components/FormField';
import { safetyApi } from '@/api/safety';
import { formatDate } from '@/lib/format';
import { t } from '@/i18n';
import toast from 'react-hot-toast';
import type { AccidentActN1, AccidentActStatus } from './types';

const statusColorMap: Record<AccidentActStatus, 'gray' | 'yellow' | 'green'> = {
  draft: 'gray',
  investigation: 'yellow',
  completed: 'green',
};

const getStatusLabels = (): Record<string, string> => ({
  draft: t('safety.accidentAct.statusDraft'),
  investigation: t('safety.accidentAct.statusInvestigation'),
  completed: t('safety.accidentAct.statusCompleted'),
});

const STATUS_TRANSITIONS: Record<AccidentActStatus, AccidentActStatus | null> = {
  draft: 'investigation',
  investigation: 'completed',
  completed: null,
};

const AccidentActN1Page: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAct, setSelectedAct] = useState<AccidentActN1 | null>(null);

  // Form state
  const [formIncidentId, setFormIncidentId] = useState('');
  const [formVictimName, setFormVictimName] = useState('');
  const [formVictimPosition, setFormVictimPosition] = useState('');
  const [formCircumstances, setFormCircumstances] = useState('');
  const [formCauses, setFormCauses] = useState('');
  const [formWitnesses, setFormWitnesses] = useState('');
  const [formResponsible, setFormResponsible] = useState('');
  const [formMeasures, setFormMeasures] = useState('');

  const { data: actsData, isLoading } = useQuery({
    queryKey: ['safety-accident-acts'],
    queryFn: () => safetyApi.getAccidentActs(),
  });

  const acts = actsData?.content ?? [];

  const createMutation = useMutation({
    mutationFn: safetyApi.createAccidentAct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safety-accident-acts'] });
      toast.success(t('safety.accidentAct.toastCreated'));
      setModalOpen(false);
      resetForm();
    },
    onError: () => {
      toast.error(t('safety.accidentAct.toastCreateError'));
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AccidentActStatus }) =>
      safetyApi.updateAccidentActStatus(id, status),
    onSuccess: (updatedAct) => {
      queryClient.invalidateQueries({ queryKey: ['safety-accident-acts'] });
      toast.success(t('safety.accidentAct.toastStatusUpdated'));
      setSelectedAct(updatedAct);
    },
    onError: () => {
      toast.error(t('safety.accidentAct.toastStatusError'));
    },
  });

  const resetForm = () => {
    setFormIncidentId('');
    setFormVictimName('');
    setFormVictimPosition('');
    setFormCircumstances('');
    setFormCauses('');
    setFormWitnesses('');
    setFormResponsible('');
    setFormMeasures('');
  };

  const filteredActs = useMemo(() => {
    let filtered = acts;
    if (statusFilter) filtered = filtered.filter((a) => a.status === statusFilter);
    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.incidentNumber.toLowerCase().includes(lower) ||
          a.victimName.toLowerCase().includes(lower) ||
          a.victimPosition.toLowerCase().includes(lower),
      );
    }
    return filtered;
  }, [acts, statusFilter, search]);

  const statusFilterOptions = [
    { value: '', label: t('safety.accidentAct.filterAllStatuses') },
    { value: 'draft', label: t('safety.accidentAct.statusDraft') },
    { value: 'investigation', label: t('safety.accidentAct.statusInvestigation') },
    { value: 'completed', label: t('safety.accidentAct.statusCompleted') },
  ];

  const columns = useMemo<ColumnDef<AccidentActN1, unknown>[]>(
    () => [
      {
        accessorKey: 'incidentNumber',
        header: t('safety.accidentAct.colIncidentNumber'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'victimName',
        header: t('safety.accidentAct.colVictimName'),
        size: 200,
        cell: ({ getValue }) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'victimPosition',
        header: t('safety.accidentAct.colVictimPosition'),
        size: 180,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('safety.accidentAct.colStatus'),
        size: 150,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={statusColorMap}
            label={getStatusLabels()[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'createdAt',
        header: t('safety.accidentAct.colCreatedAt'),
        size: 130,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-700 dark:text-neutral-300">
            {formatDate(getValue<string>())}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        size: 120,
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="xs"
              onClick={(e) => { e.stopPropagation(); setSelectedAct(row.original); }}
            >
              {t('common.details')}
            </Button>
            <Button
              variant="ghost"
              size="xs"
              iconLeft={<Download size={14} />}
              onClick={(e) => {
                e.stopPropagation();
                toast.success(t('safety.accidentAct.toastPdfExported'));
              }}
            />
          </div>
        ),
      },
    ],
    [],
  );

  const handleCreate = () => {
    createMutation.mutate({
      incidentId: formIncidentId,
      victimName: formVictimName,
      victimPosition: formVictimPosition,
      circumstances: formCircumstances,
      causes: formCauses,
      witnesses: formWitnesses || undefined,
      responsiblePersons: formResponsible,
      correctiveMeasures: formMeasures,
    });
  };

  const handleAdvanceStatus = () => {
    if (!selectedAct) return;
    const nextStatus = STATUS_TRANSITIONS[selectedAct.status];
    if (!nextStatus) return;
    statusMutation.mutate({ id: selectedAct.id, status: nextStatus });
  };

  const getNextStatusLabel = (currentStatus: AccidentActStatus): string | null => {
    const next = STATUS_TRANSITIONS[currentStatus];
    if (!next) return null;
    return getStatusLabels()[next] ?? next;
  };

  // Detail view
  if (selectedAct) {
    const nextStatusLabel = getNextStatusLabel(selectedAct.status);
    return (
      <div className="animate-fade-in">
        <PageHeader
          title={`${t('safety.accidentAct.modalTitle')} \u2014 ${selectedAct.incidentNumber}`}
          breadcrumbs={[
            { label: t('safety.accidentAct.breadcrumbHome'), href: '/' },
            { label: t('safety.accidentAct.breadcrumbSafety'), href: '/safety' },
            { label: t('safety.accidentAct.breadcrumbAccidentActs'), href: '/safety/accident-acts' },
            { label: selectedAct.incidentNumber },
          ]}
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                iconLeft={<ArrowLeft size={16} />}
                onClick={() => setSelectedAct(null)}
              >
                {t('common.back')}
              </Button>
              {nextStatusLabel && (
                <Button
                  iconLeft={<ArrowRight size={16} />}
                  onClick={handleAdvanceStatus}
                  loading={statusMutation.isPending}
                >
                  {t('safety.accidentAct.btnAdvanceTo', { status: nextStatusLabel })}
                </Button>
              )}
              <Button
                variant="secondary"
                iconLeft={<Download size={16} />}
                onClick={() => toast.success(t('safety.accidentAct.toastPdfExported'))}
              >
                {t('safety.accidentAct.btnExportPdf')}
              </Button>
            </div>
          }
        />

        {/* Status workflow progress */}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            {(['draft', 'investigation', 'completed'] as AccidentActStatus[]).map((step, idx) => {
              const isCurrent = selectedAct.status === step;
              const isPast =
                (step === 'draft' && (selectedAct.status === 'investigation' || selectedAct.status === 'completed')) ||
                (step === 'investigation' && selectedAct.status === 'completed');
              return (
                <React.Fragment key={step}>
                  {idx > 0 && (
                    <div className={`flex-1 h-0.5 ${isPast || isCurrent ? 'bg-primary-500' : 'bg-neutral-200 dark:bg-neutral-700'}`} />
                  )}
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                        isCurrent
                          ? 'bg-primary-500 text-white'
                          : isPast
                            ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <span className={`text-xs ${isCurrent ? 'font-semibold text-primary-700 dark:text-primary-300' : 'text-neutral-500 dark:text-neutral-400'}`}>
                      {getStatusLabels()[step]}
                    </span>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          {/* Status */}
          <div className="flex items-center gap-3">
            <StatusBadge
              status={selectedAct.status}
              colorMap={statusColorMap}
              label={getStatusLabels()[selectedAct.status] ?? selectedAct.status}
              size="md"
            />
            <span className="text-sm text-neutral-500 dark:text-neutral-400">
              {t('safety.accidentAct.linkedIncident')}: {selectedAct.incidentNumber}
            </span>
          </div>

          {/* Victim info */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
              {t('safety.accidentAct.sectionVictim')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('safety.accidentAct.labelVictimName')}</p>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{selectedAct.victimName}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('safety.accidentAct.labelVictimPosition')}</p>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{selectedAct.victimPosition}</p>
              </div>
            </div>
          </div>

          {/* Circumstances */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
              {t('safety.accidentAct.sectionCircumstances')}
            </h3>
            <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">
              {selectedAct.circumstances}
            </p>
          </div>

          {/* Causes */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
              {t('safety.accidentAct.sectionCauses')}
            </h3>
            <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">
              {selectedAct.causes}
            </p>
          </div>

          {/* Witnesses */}
          {selectedAct.witnesses && (
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
                {t('safety.accidentAct.sectionWitnesses')}
              </h3>
              <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">
                {selectedAct.witnesses}
              </p>
            </div>
          )}

          {/* Responsible Persons */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
              {t('safety.accidentAct.sectionResponsible')}
            </h3>
            <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">
              {selectedAct.responsiblePersons}
            </p>
          </div>

          {/* Corrective Measures */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
              {t('safety.accidentAct.sectionMeasures')}
            </h3>
            <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">
              {selectedAct.correctiveMeasures}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('safety.accidentAct.title')}
        subtitle={t('safety.accidentAct.subtitle')}
        breadcrumbs={[
          { label: t('safety.accidentAct.breadcrumbHome'), href: '/' },
          { label: t('safety.accidentAct.breadcrumbSafety'), href: '/safety' },
          { label: t('safety.accidentAct.breadcrumbAccidentActs') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => setModalOpen(true)}>
            {t('safety.accidentAct.btnNew')}
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('safety.accidentAct.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={statusFilterOptions}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-48"
        />
      </div>

      <DataTable<AccidentActN1>
        data={filteredActs}
        columns={columns}
        loading={isLoading}
        onRowClick={(act) => setSelectedAct(act)}
        enableExport
        enableColumnVisibility
        pageSize={20}
        emptyTitle={t('safety.accidentAct.emptyTitle')}
        emptyDescription={t('safety.accidentAct.emptyDescription')}
      />

      {/* Create Act Modal */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); resetForm(); }}
        title={t('safety.accidentAct.modalTitle')}
        description={t('safety.accidentAct.modalDescription')}
        size="xl"
        footer={
          <>
            <Button variant="outline" onClick={() => { setModalOpen(false); resetForm(); }}>
              {t('safety.accidentAct.btnCancel')}
            </Button>
            <Button
              onClick={handleCreate}
              loading={createMutation.isPending}
              iconLeft={<FileText size={16} />}
              disabled={
                !formIncidentId ||
                !formVictimName ||
                !formVictimPosition ||
                !formCircumstances ||
                !formCauses
              }
            >
              {t('safety.accidentAct.btnCreate')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label={t('safety.accidentAct.labelIncidentId')} required>
            <Input
              placeholder={t('safety.accidentAct.placeholderIncidentId')}
              value={formIncidentId}
              onChange={(e) => setFormIncidentId(e.target.value)}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('safety.accidentAct.labelVictimName')} required>
              <Input
                placeholder={t('safety.accidentAct.placeholderVictimName')}
                value={formVictimName}
                onChange={(e) => setFormVictimName(e.target.value)}
              />
            </FormField>
            <FormField label={t('safety.accidentAct.labelVictimPosition')} required>
              <Input
                placeholder={t('safety.accidentAct.placeholderVictimPosition')}
                value={formVictimPosition}
                onChange={(e) => setFormVictimPosition(e.target.value)}
              />
            </FormField>
          </div>
          <FormField label={t('safety.accidentAct.labelCircumstances')} required>
            <Textarea
              placeholder={t('safety.accidentAct.placeholderCircumstances')}
              value={formCircumstances}
              onChange={(e) => setFormCircumstances(e.target.value)}
              rows={4}
            />
          </FormField>
          <FormField label={t('safety.accidentAct.labelCauses')} required>
            <Textarea
              placeholder={t('safety.accidentAct.placeholderCauses')}
              value={formCauses}
              onChange={(e) => setFormCauses(e.target.value)}
              rows={3}
            />
          </FormField>
          <FormField label={t('safety.accidentAct.labelWitnesses')}>
            <Textarea
              placeholder={t('safety.accidentAct.placeholderWitnesses')}
              value={formWitnesses}
              onChange={(e) => setFormWitnesses(e.target.value)}
              rows={3}
            />
          </FormField>
          <FormField label={t('safety.accidentAct.labelResponsiblePersons')}>
            <Textarea
              placeholder={t('safety.accidentAct.placeholderResponsiblePersons')}
              value={formResponsible}
              onChange={(e) => setFormResponsible(e.target.value)}
              rows={3}
            />
          </FormField>
          <FormField label={t('safety.accidentAct.labelCorrectiveMeasures')}>
            <Textarea
              placeholder={t('safety.accidentAct.placeholderCorrectiveMeasures')}
              value={formMeasures}
              onChange={(e) => setFormMeasures(e.target.value)}
              rows={3}
            />
          </FormField>
        </div>
      </Modal>
    </div>
  );
};

export default AccidentActN1Page;
