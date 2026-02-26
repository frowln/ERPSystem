import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Download,
  BookOpen,
  Calendar,
  FolderKanban,
  PlusCircle,
  Cloud,
  Users,
  Wrench,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { DataTable } from '@/design-system/components/DataTable';
import { Button } from '@/design-system/components/Button';
import { Modal } from '@/design-system/components/Modal';
import { FormField, Input, Select, Textarea } from '@/design-system/components/FormField';
import { execDocsApi } from '@/api/execDocs';
import { projectsApi } from '@/api/projects';
import { formatDate } from '@/lib/format';
import { t } from '@/i18n';
import toast from 'react-hot-toast';
import type { Ks6Entry } from './types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const currentYear = new Date().getFullYear();

const yearOptions = Array.from({ length: 5 }, (_, i) => {
  const y = currentYear - i;
  return { value: String(y), label: String(y) };
});

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

const Ks6JournalPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [projectId, setProjectId] = useState('');
  const [year, setYear] = useState(String(currentYear));
  const [showCreate, setShowCreate] = useState(false);

  // Form state
  const [formDate, setFormDate] = useState('');
  const [workDescription, setWorkDescription] = useState('');
  const [unit, setUnit] = useState('');
  const [quantity, setQuantity] = useState('');
  const [contractorName, setContractorName] = useState('');
  const [weatherConditions, setWeatherConditions] = useState('');
  const [personnelCount, setPersonnelCount] = useState('');
  const [equipmentUsed, setEquipmentUsed] = useState('');
  const [notes, setNotes] = useState('');

  const { data: projects } = useQuery({
    queryKey: ['projects-select'],
    queryFn: () => projectsApi.getProjects({ size: 200 }),
  });

  const projectOptions = (projects?.content ?? []).map((p) => ({
    value: p.id,
    label: p.name,
  }));

  const { data: entries, isLoading } = useQuery<Ks6Entry[]>({
    queryKey: ['ks6-entries', projectId, year],
    queryFn: () => execDocsApi.getKs6Entries(projectId, parseInt(year, 10)),
    enabled: !!projectId && !!year,
  });

  const items = entries ?? [];

  const createMutation = useMutation({
    mutationFn: () =>
      execDocsApi.createKs6Entry({
        date: formDate,
        workDescription,
        unit,
        quantity: parseFloat(quantity) || 0,
        contractorName,
        weatherConditions,
        personnelCount: parseInt(personnelCount, 10) || 0,
        equipmentUsed,
        notes,
        projectId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ks6-entries', projectId, year] });
      toast.success(t('execDocs.ks6.toastCreated'));
      closeModal();
    },
    onError: () => toast.error(t('execDocs.ks6.toastCreateError')),
  });

  const closeModal = useCallback(() => {
    setShowCreate(false);
    setFormDate('');
    setWorkDescription('');
    setUnit('');
    setQuantity('');
    setContractorName('');
    setWeatherConditions('');
    setPersonnelCount('');
    setEquipmentUsed('');
    setNotes('');
  }, []);

  const handleCreate = useCallback(() => {
    if (!formDate) {
      toast.error(t('execDocs.ks6.validationDate'));
      return;
    }
    if (!workDescription.trim()) {
      toast.error(t('execDocs.ks6.validationWorkDescription'));
      return;
    }
    createMutation.mutate();
  }, [formDate, workDescription, createMutation]);

  const handleExport = () => {
    toast.success(t('execDocs.ks6.toastExportStarted'));
  };

  const columns = useMemo<ColumnDef<Ks6Entry, unknown>[]>(
    () => [
      {
        accessorKey: 'date',
        header: t('execDocs.ks6.colDate'),
        size: 110,
        cell: ({ getValue }) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100 tabular-nums text-sm">
            {formatDate(getValue<string>())}
          </span>
        ),
      },
      {
        accessorKey: 'workDescription',
        header: t('execDocs.ks6.colWorkDescription'),
        size: 280,
        cell: ({ getValue }) => (
          <span className="text-neutral-800 dark:text-neutral-200 text-sm">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'unit',
        header: t('execDocs.ks6.colUnit'),
        size: 80,
        cell: ({ getValue }) => (
          <span className="text-neutral-500 dark:text-neutral-400 text-xs">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'quantity',
        header: t('execDocs.ks6.colQuantity'),
        size: 100,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-right block text-sm">
            {getValue<number>().toLocaleString('ru-RU')}
          </span>
        ),
      },
      {
        accessorKey: 'contractorName',
        header: t('execDocs.ks6.colContractor'),
        size: 180,
        cell: ({ getValue }) => (
          <span className="text-neutral-600 dark:text-neutral-400 text-sm">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'weatherConditions',
        header: t('execDocs.ks6.colWeather'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="text-neutral-500 dark:text-neutral-400 text-sm flex items-center gap-1">
            <Cloud size={12} />
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'personnelCount',
        header: t('execDocs.ks6.colPersonnel'),
        size: 100,
        cell: ({ getValue }) => (
          <span className="text-neutral-600 dark:text-neutral-400 text-sm flex items-center gap-1">
            <Users size={12} />
            {getValue<number>()}
          </span>
        ),
      },
      {
        accessorKey: 'equipmentUsed',
        header: t('execDocs.ks6.colEquipment'),
        size: 160,
        cell: ({ getValue }) => (
          <span className="text-neutral-500 dark:text-neutral-400 text-sm flex items-center gap-1">
            <Wrench size={12} />
            {getValue<string>()}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('execDocs.ks6.title')}
        subtitle={t('execDocs.ks6.subtitle')}
        breadcrumbs={[
          { label: t('execDocs.breadcrumbHome'), href: '/' },
          { label: t('execDocs.ks6.breadcrumb') },
        ]}
        actions={
          projectId ? (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download size={14} className="mr-1" />
                {t('execDocs.ks6.actionExport')}
              </Button>
              <Button size="sm" onClick={() => setShowCreate(true)}>
                <PlusCircle size={14} className="mr-1" />
                {t('execDocs.ks6.actionCreate')}
              </Button>
            </div>
          ) : null
        }
      />

      {/* Selectors */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-2">
          <FolderKanban size={16} className="text-neutral-400" />
          <div className="w-64">
            <Select
              options={projectOptions}
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              placeholder={t('execDocs.ks6.selectProject')}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-neutral-400" />
          <div className="w-32">
            <Select
              options={yearOptions}
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Table or empty state */}
      {projectId ? (
        <DataTable<Ks6Entry>
          data={items}
          columns={columns}
          loading={isLoading}
          enableColumnVisibility
          enableDensityToggle
          enableExport
          pageSize={50}
          emptyTitle={t('execDocs.ks6.emptyTitle')}
          emptyDescription={t('execDocs.ks6.emptyDescription')}
        />
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BookOpen size={48} className="text-neutral-300 dark:text-neutral-600 mb-4" />
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">
            {t('execDocs.ks6.selectProjectHint')}
          </p>
        </div>
      )}

      {/* Create Entry Modal */}
      <Modal
        open={showCreate}
        onClose={closeModal}
        title={t('execDocs.ks6.modalCreateTitle')}
        size="lg"
      >
        <div className="space-y-4">
          <FormField label={t('execDocs.ks6.fieldDate')} required>
            <Input
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
            />
          </FormField>

          <FormField label={t('execDocs.ks6.fieldWorkDescription')} required>
            <Textarea
              value={workDescription}
              onChange={(e) => setWorkDescription(e.target.value)}
              placeholder={t('execDocs.ks6.placeholderWorkDescription')}
              rows={2}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('execDocs.ks6.fieldUnit')}>
              <Input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder={t('execDocs.ks6.placeholderUnit')}
              />
            </FormField>
            <FormField label={t('execDocs.ks6.fieldQuantity')}>
              <Input
                type="text"
                inputMode="numeric"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
              />
            </FormField>
          </div>

          <FormField label={t('execDocs.ks6.fieldContractor')}>
            <Input
              value={contractorName}
              onChange={(e) => setContractorName(e.target.value)}
              placeholder={t('execDocs.ks6.placeholderContractor')}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('execDocs.ks6.fieldWeather')}>
              <Input
                value={weatherConditions}
                onChange={(e) => setWeatherConditions(e.target.value)}
                placeholder={t('execDocs.ks6.placeholderWeather')}
              />
            </FormField>
            <FormField label={t('execDocs.ks6.fieldPersonnel')}>
              <Input
                type="text"
                inputMode="numeric"
                value={personnelCount}
                onChange={(e) => setPersonnelCount(e.target.value)}
                placeholder="0"
              />
            </FormField>
          </div>

          <FormField label={t('execDocs.ks6.fieldEquipment')}>
            <Input
              value={equipmentUsed}
              onChange={(e) => setEquipmentUsed(e.target.value)}
              placeholder={t('execDocs.ks6.placeholderEquipment')}
            />
          </FormField>

          <FormField label={t('execDocs.ks6.fieldNotes')}>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('execDocs.ks6.placeholderNotes')}
              rows={2}
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={closeModal}>
              {t('common.cancel')}
            </Button>
            <Button loading={createMutation.isPending} onClick={handleCreate}>
              <PlusCircle size={14} className="mr-1" />
              {t('execDocs.ks6.actionCreate')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Ks6JournalPage;
