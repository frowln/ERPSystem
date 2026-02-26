import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  PlusCircle,
  BookOpen,
  FolderKanban,
  Blocks,
  HardHat,
  CircleDot,
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
import type { SpecialJournalEntry, SpecialJournalType } from './types';

// ---------------------------------------------------------------------------
// Tab config
// ---------------------------------------------------------------------------

type TabId = SpecialJournalType;

const TAB_ICONS: Record<TabId, React.ReactNode> = {
  concrete: <Blocks size={14} />,
  installation: <HardHat size={14} />,
  pile: <CircleDot size={14} />,
};

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

const SpecialJournalsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('concrete');
  const [projectId, setProjectId] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  // Form state
  const [formDate, setFormDate] = useState('');
  const [workDescription, setWorkDescription] = useState('');
  const [volume, setVolume] = useState('');
  const [unit, setUnit] = useState('');
  const [weather, setWeather] = useState('');
  const [responsibleName, setResponsibleName] = useState('');
  const [notes, setNotes] = useState('');

  const { data: projects } = useQuery({
    queryKey: ['projects-select'],
    queryFn: () => projectsApi.getProjects({ size: 200 }),
  });

  const projectOptions = (projects?.content ?? []).map((p) => ({
    value: p.id,
    label: p.name,
  }));

  const { data: entries, isLoading } = useQuery<SpecialJournalEntry[]>({
    queryKey: ['special-journal-entries', projectId, activeTab],
    queryFn: () => execDocsApi.getSpecialJournalEntries(projectId, activeTab),
    enabled: !!projectId,
  });

  const items = entries ?? [];

  const createMutation = useMutation({
    mutationFn: () =>
      execDocsApi.createSpecialJournalEntry({
        date: formDate,
        journalType: activeTab,
        workDescription,
        volume: parseFloat(volume) || 0,
        unit,
        weather,
        responsibleName,
        notes,
        projectId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['special-journal-entries', projectId, activeTab] });
      toast.success(t('execDocs.specialJournals.toastCreated'));
      closeModal();
    },
    onError: () => toast.error(t('execDocs.specialJournals.toastCreateError')),
  });

  const closeModal = useCallback(() => {
    setShowCreate(false);
    setFormDate('');
    setWorkDescription('');
    setVolume('');
    setUnit('');
    setWeather('');
    setResponsibleName('');
    setNotes('');
  }, []);

  const handleCreate = useCallback(() => {
    if (!formDate) {
      toast.error(t('execDocs.specialJournals.validationDate'));
      return;
    }
    if (!workDescription.trim()) {
      toast.error(t('execDocs.specialJournals.validationWorkDescription'));
      return;
    }
    createMutation.mutate();
  }, [formDate, workDescription, createMutation]);

  const columns = useMemo<ColumnDef<SpecialJournalEntry, unknown>[]>(
    () => [
      {
        accessorKey: 'date',
        header: t('execDocs.specialJournals.colDate'),
        size: 110,
        cell: ({ getValue }) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100 tabular-nums text-sm">
            {formatDate(getValue<string>())}
          </span>
        ),
      },
      {
        accessorKey: 'workDescription',
        header: t('execDocs.specialJournals.colWorkDescription'),
        size: 300,
        cell: ({ getValue }) => (
          <span className="text-neutral-800 dark:text-neutral-200 text-sm">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'volume',
        header: t('execDocs.specialJournals.colVolume'),
        size: 100,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-right block text-sm font-medium">
            {getValue<number>().toLocaleString('ru-RU')}
          </span>
        ),
      },
      {
        accessorKey: 'unit',
        header: t('execDocs.specialJournals.colUnit'),
        size: 80,
        cell: ({ getValue }) => (
          <span className="text-neutral-500 dark:text-neutral-400 text-xs">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'weather',
        header: t('execDocs.specialJournals.colWeather'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="text-neutral-500 dark:text-neutral-400 text-sm">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'responsibleName',
        header: t('execDocs.specialJournals.colResponsible'),
        size: 180,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300 text-sm">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'notes',
        header: t('execDocs.specialJournals.colNotes'),
        size: 200,
        cell: ({ getValue }) => (
          <span className="text-neutral-500 dark:text-neutral-400 text-sm line-clamp-2">
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
        title={t('execDocs.specialJournals.title')}
        subtitle={t('execDocs.specialJournals.subtitle')}
        breadcrumbs={[
          { label: t('execDocs.breadcrumbHome'), href: '/' },
          { label: t('execDocs.specialJournals.breadcrumb') },
        ]}
        tabs={[
          { id: 'concrete', label: t('execDocs.specialJournals.tabConcrete') },
          { id: 'installation', label: t('execDocs.specialJournals.tabInstallation') },
          { id: 'pile', label: t('execDocs.specialJournals.tabPile') },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
        actions={
          projectId ? (
            <Button size="sm" onClick={() => setShowCreate(true)}>
              <PlusCircle size={14} className="mr-1" />
              {t('execDocs.specialJournals.actionCreate')}
            </Button>
          ) : null
        }
      />

      {/* Project selector */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-2">
          <FolderKanban size={16} className="text-neutral-400" />
          <div className="w-64">
            <Select
              options={projectOptions}
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              placeholder={t('execDocs.specialJournals.selectProject')}
            />
          </div>
        </div>
      </div>

      {/* Table or empty state */}
      {projectId ? (
        <DataTable<SpecialJournalEntry>
          data={items}
          columns={columns}
          loading={isLoading}
          enableColumnVisibility
          enableDensityToggle
          enableExport
          pageSize={20}
          emptyTitle={t('execDocs.specialJournals.emptyTitle')}
          emptyDescription={t('execDocs.specialJournals.emptyDescription')}
        />
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BookOpen size={48} className="text-neutral-300 dark:text-neutral-600 mb-4" />
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">
            {t('execDocs.specialJournals.selectProjectHint')}
          </p>
        </div>
      )}

      {/* Create Entry Modal */}
      <Modal
        open={showCreate}
        onClose={closeModal}
        title={t('execDocs.specialJournals.modalCreateTitle', {
          type: t(`execDocs.specialJournals.tab${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`),
        })}
        size="lg"
      >
        <div className="space-y-4">
          <FormField label={t('execDocs.specialJournals.fieldDate')} required>
            <Input
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
            />
          </FormField>

          <FormField label={t('execDocs.specialJournals.fieldWorkDescription')} required>
            <Textarea
              value={workDescription}
              onChange={(e) => setWorkDescription(e.target.value)}
              placeholder={t('execDocs.specialJournals.placeholderWorkDescription')}
              rows={2}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('execDocs.specialJournals.fieldVolume')}>
              <Input
                type="text"
                inputMode="numeric"
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
                placeholder="0"
              />
            </FormField>
            <FormField label={t('execDocs.specialJournals.fieldUnit')}>
              <Input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder={t('execDocs.specialJournals.placeholderUnit')}
              />
            </FormField>
          </div>

          <FormField label={t('execDocs.specialJournals.fieldWeather')}>
            <Input
              value={weather}
              onChange={(e) => setWeather(e.target.value)}
              placeholder={t('execDocs.specialJournals.placeholderWeather')}
            />
          </FormField>

          <FormField label={t('execDocs.specialJournals.fieldResponsible')}>
            <Input
              value={responsibleName}
              onChange={(e) => setResponsibleName(e.target.value)}
              placeholder={t('execDocs.specialJournals.placeholderResponsible')}
            />
          </FormField>

          <FormField label={t('execDocs.specialJournals.fieldNotes')}>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('execDocs.specialJournals.placeholderNotes')}
              rows={2}
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={closeModal}>
              {t('common.cancel')}
            </Button>
            <Button loading={createMutation.isPending} onClick={handleCreate}>
              <PlusCircle size={14} className="mr-1" />
              {t('execDocs.specialJournals.actionCreate')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SpecialJournalsPage;
