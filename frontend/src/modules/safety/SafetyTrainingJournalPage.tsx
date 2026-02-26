import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, BookOpen, Printer } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Button } from '@/design-system/components/Button';
import { Modal } from '@/design-system/components/Modal';
import { FormField, Input, Select } from '@/design-system/components/FormField';
import { safetyApi } from '@/api/safety';
import { formatDate } from '@/lib/format';
import { t } from '@/i18n';
import toast from 'react-hot-toast';
import type { TrainingRecord, TrainingRecordType, TrainingResult } from './types';

const trainingTypeColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'orange' | 'purple'> = {
  initial: 'blue',
  primary: 'green',
  repeat: 'yellow',
  unscheduled: 'orange',
  targeted: 'purple',
};

const resultColorMap: Record<string, 'green' | 'red'> = {
  pass: 'green',
  fail: 'red',
};

const getTypeLabels = (): Record<string, string> => ({
  initial: t('safety.trainingJournal.typeInitial'),
  primary: t('safety.trainingJournal.typePrimary'),
  repeat: t('safety.trainingJournal.typeRepeat'),
  unscheduled: t('safety.trainingJournal.typeUnscheduled'),
  targeted: t('safety.trainingJournal.typeTargeted'),
});

const getResultLabels = (): Record<string, string> => ({
  pass: t('safety.trainingJournal.resultPass'),
  fail: t('safety.trainingJournal.resultFail'),
});

function getComplianceStatus(nextDate: string): 'overdue' | 'upcoming' | 'ok' {
  const next = new Date(nextDate);
  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  if (next < now) return 'overdue';
  if (next < thirtyDaysFromNow) return 'upcoming';
  return 'ok';
}

const complianceColorMap: Record<string, 'red' | 'yellow' | 'green'> = {
  overdue: 'red',
  upcoming: 'yellow',
  ok: 'green',
};

const getComplianceLabels = (): Record<string, string> => ({
  overdue: t('safety.trainingJournal.statusOverdue'),
  upcoming: t('safety.trainingJournal.statusUpcoming'),
  ok: t('safety.trainingJournal.statusOk'),
});

const SafetyTrainingJournalPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  // Form state
  const [formEmployee, setFormEmployee] = useState('');
  const [formType, setFormType] = useState<TrainingRecordType>('initial');
  const [formDate, setFormDate] = useState('');
  const [formInstructor, setFormInstructor] = useState('');
  const [formResult, setFormResult] = useState<TrainingResult>('pass');
  const [formNextDate, setFormNextDate] = useState('');
  const [formProject, setFormProject] = useState('');

  const { data: recordsData, isLoading } = useQuery({
    queryKey: ['safety-training-records'],
    queryFn: () => safetyApi.getTrainingRecords(),
  });

  const records = recordsData?.content ?? [];

  const createMutation = useMutation({
    mutationFn: safetyApi.createTrainingRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safety-training-records'] });
      toast.success(t('safety.trainingJournal.toastCreated'));
      setModalOpen(false);
      resetForm();
    },
    onError: () => {
      toast.error(t('safety.trainingJournal.toastCreateError'));
    },
  });

  const resetForm = () => {
    setFormEmployee('');
    setFormType('initial');
    setFormDate('');
    setFormInstructor('');
    setFormResult('pass');
    setFormNextDate('');
    setFormProject('');
  };

  const filteredRecords = useMemo(() => {
    let filtered = records;
    if (typeFilter) {
      filtered = filtered.filter((r) => r.trainingType === typeFilter);
    }
    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.employeeName.toLowerCase().includes(lower) ||
          r.instructor.toLowerCase().includes(lower) ||
          r.projectName.toLowerCase().includes(lower),
      );
    }
    return filtered;
  }, [records, typeFilter, search]);

  const typeFilterOptions = [
    { value: '', label: t('safety.trainingJournal.filterAllTypes') },
    { value: 'initial', label: t('safety.trainingJournal.typeInitial') },
    { value: 'primary', label: t('safety.trainingJournal.typePrimary') },
    { value: 'repeat', label: t('safety.trainingJournal.typeRepeat') },
    { value: 'unscheduled', label: t('safety.trainingJournal.typeUnscheduled') },
    { value: 'targeted', label: t('safety.trainingJournal.typeTargeted') },
  ];

  const typeSelectOptions = [
    { value: 'initial', label: t('safety.trainingJournal.typeInitial') },
    { value: 'primary', label: t('safety.trainingJournal.typePrimary') },
    { value: 'repeat', label: t('safety.trainingJournal.typeRepeat') },
    { value: 'unscheduled', label: t('safety.trainingJournal.typeUnscheduled') },
    { value: 'targeted', label: t('safety.trainingJournal.typeTargeted') },
  ];

  const resultSelectOptions = [
    { value: 'pass', label: t('safety.trainingJournal.resultPass') },
    { value: 'fail', label: t('safety.trainingJournal.resultFail') },
  ];

  const columns = useMemo<ColumnDef<TrainingRecord, unknown>[]>(
    () => [
      {
        accessorKey: 'employeeName',
        header: t('safety.trainingJournal.colEmployee'),
        size: 200,
        cell: ({ getValue }) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'trainingType',
        header: t('safety.trainingJournal.colType'),
        size: 150,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={trainingTypeColorMap}
            label={getTypeLabels()[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'date',
        header: t('safety.trainingJournal.colDate'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-700 dark:text-neutral-300">
            {formatDate(getValue<string>())}
          </span>
        ),
      },
      {
        accessorKey: 'instructor',
        header: t('safety.trainingJournal.colInstructor'),
        size: 180,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'result',
        header: t('safety.trainingJournal.colResult'),
        size: 100,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={resultColorMap}
            label={getResultLabels()[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'nextDate',
        header: t('safety.trainingJournal.colNextDate'),
        size: 150,
        cell: ({ getValue }) => {
          const val = getValue<string>();
          const status = getComplianceStatus(val);
          return (
            <div className="flex items-center gap-2">
              <span className="tabular-nums text-neutral-700 dark:text-neutral-300">
                {formatDate(val)}
              </span>
              <StatusBadge
                status={status}
                colorMap={complianceColorMap}
                label={getComplianceLabels()[status]}
              />
            </div>
          );
        },
      },
      {
        accessorKey: 'projectName',
        header: t('safety.trainingJournal.colProject'),
        size: 180,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300 truncate">
            {getValue<string>()}
          </span>
        ),
      },
    ],
    [],
  );

  const handleCreate = () => {
    createMutation.mutate({
      employeeId: formEmployee.replace(/\s/g, '-').toLowerCase(),
      employeeName: formEmployee,
      trainingType: formType,
      date: formDate,
      instructor: formInstructor,
      result: formResult,
      nextDate: formNextDate,
      projectId: formProject.replace(/\s/g, '-').toLowerCase(),
      projectName: formProject,
    });
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('safety.trainingJournal.title')}
        subtitle={t('safety.trainingJournal.subtitle')}
        breadcrumbs={[
          { label: t('safety.trainingJournal.breadcrumbHome'), href: '/' },
          { label: t('safety.trainingJournal.breadcrumbSafety'), href: '/safety' },
          { label: t('safety.trainingJournal.breadcrumbTrainingJournal') },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              iconLeft={<Printer size={16} />}
              onClick={() => window.print()}
            >
              {t('safety.trainingJournal.btnPrint')}
            </Button>
            <Button iconLeft={<Plus size={16} />} onClick={() => setModalOpen(true)}>
              {t('safety.trainingJournal.btnNew')}
            </Button>
          </div>
        }
      />

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('safety.trainingJournal.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={typeFilterOptions}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-48"
        />
      </div>

      <DataTable<TrainingRecord>
        data={filteredRecords}
        columns={columns}
        loading={isLoading}
        enableColumnVisibility
        enableExport
        pageSize={20}
        emptyTitle={t('safety.trainingJournal.emptyTitle')}
        emptyDescription={t('safety.trainingJournal.emptyDescription')}
      />

      {/* Create Training Record Modal */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); resetForm(); }}
        title={t('safety.trainingJournal.modalTitle')}
        description={t('safety.trainingJournal.modalDescription')}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => { setModalOpen(false); resetForm(); }}>
              {t('safety.trainingJournal.btnCancel')}
            </Button>
            <Button
              onClick={handleCreate}
              loading={createMutation.isPending}
              iconLeft={<BookOpen size={16} />}
              disabled={!formEmployee || !formDate || !formInstructor || !formNextDate}
            >
              {t('safety.trainingJournal.btnCreate')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label={t('safety.trainingJournal.labelEmployee')} required>
            <Input
              placeholder={t('safety.trainingJournal.placeholderEmployee')}
              value={formEmployee}
              onChange={(e) => setFormEmployee(e.target.value)}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('safety.trainingJournal.labelType')} required>
              <Select
                options={typeSelectOptions}
                value={formType}
                onChange={(e) => setFormType(e.target.value as TrainingRecordType)}
              />
            </FormField>
            <FormField label={t('safety.trainingJournal.labelResult')} required>
              <Select
                options={resultSelectOptions}
                value={formResult}
                onChange={(e) => setFormResult(e.target.value as TrainingResult)}
              />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('safety.trainingJournal.labelDate')} required>
              <Input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
              />
            </FormField>
            <FormField label={t('safety.trainingJournal.labelNextDate')} required>
              <Input
                type="date"
                value={formNextDate}
                onChange={(e) => setFormNextDate(e.target.value)}
              />
            </FormField>
          </div>
          <FormField label={t('safety.trainingJournal.labelInstructor')} required>
            <Input
              placeholder={t('safety.trainingJournal.placeholderInstructor')}
              value={formInstructor}
              onChange={(e) => setFormInstructor(e.target.value)}
            />
          </FormField>
          <FormField label={t('safety.trainingJournal.labelProject')}>
            <Input
              placeholder={t('safety.trainingJournal.placeholderProject')}
              value={formProject}
              onChange={(e) => setFormProject(e.target.value)}
            />
          </FormField>
        </div>
      </Modal>
    </div>
  );
};

export default SafetyTrainingJournalPage;
