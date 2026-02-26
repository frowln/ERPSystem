import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, BookOpen } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Modal } from '@/design-system/components/Modal';
import { FormField, Input, Select, Textarea } from '@/design-system/components/FormField';
import { qualityApi } from '@/api/quality';
import { formatDate } from '@/lib/format';
import { t } from '@/i18n';
import toast from 'react-hot-toast';
import type {
  SupervisionEntry,
  ComplianceStatus,
  CreateSupervisionEntryRequest,
} from '@/modules/quality/types';

const complianceColorMap: Record<string, 'green' | 'red' | 'yellow'> = {
  compliant: 'green',
  non_compliant: 'red',
  partial: 'yellow',
};

const getComplianceLabels = (): Record<string, string> => ({
  compliant: t('quality.supervisionJournal.complianceCompliant'),
  non_compliant: t('quality.supervisionJournal.complianceNonCompliant'),
  partial: t('quality.supervisionJournal.compliancePartial'),
});

type TabId = 'all' | 'compliant' | 'non_compliant' | 'partial';

const AuthorSupervisionJournalPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [complianceFilter, setComplianceFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [form, setForm] = useState({
    date: '',
    inspectorName: '',
    workType: '',
    remarks: '',
    directives: '',
    projectId: '',
  });

  const { data: entriesData, isLoading } = useQuery({
    queryKey: ['supervision-entries'],
    queryFn: () => qualityApi.getSupervisionEntries(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateSupervisionEntryRequest) =>
      qualityApi.createSupervisionEntry(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supervision-entries'] });
      toast.success(t('quality.supervisionJournal.toastCreated'));
      setShowModal(false);
      resetForm();
    },
    onError: () => {
      toast.error(t('quality.supervisionJournal.toastCreateError'));
    },
  });

  const entries = entriesData?.content ?? [];

  const filteredEntries = useMemo(() => {
    let filtered = entries;
    if (activeTab !== 'all')
      filtered = filtered.filter((e) => e.complianceStatus === activeTab);
    if (complianceFilter)
      filtered = filtered.filter((e) => e.complianceStatus === complianceFilter);
    if (dateFrom) filtered = filtered.filter((e) => e.date >= dateFrom);
    if (dateTo) filtered = filtered.filter((e) => e.date <= dateTo);
    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.inspectorName.toLowerCase().includes(lower) ||
          e.workType.toLowerCase().includes(lower) ||
          e.number.toLowerCase().includes(lower),
      );
    }
    return filtered;
  }, [entries, activeTab, complianceFilter, dateFrom, dateTo, search]);

  const tabCounts = useMemo(
    () => ({
      all: entries.length,
      compliant: entries.filter((e) => e.complianceStatus === 'compliant').length,
      non_compliant: entries.filter((e) => e.complianceStatus === 'non_compliant').length,
      partial: entries.filter((e) => e.complianceStatus === 'partial').length,
    }),
    [entries],
  );

  const resetForm = () => {
    setForm({
      date: '',
      inspectorName: '',
      workType: '',
      remarks: '',
      directives: '',
      projectId: '',
    });
  };

  const handleCreate = () => {
    createMutation.mutate({
      date: form.date,
      inspectorName: form.inspectorName,
      workType: form.workType,
      remarks: form.remarks,
      directives: form.directives,
      projectId: form.projectId,
    });
  };

  const columns = useMemo<ColumnDef<SupervisionEntry, unknown>[]>(() => {
    const complianceLabels = getComplianceLabels();
    return [
      {
        accessorKey: 'number',
        header: t('quality.supervisionJournal.colNumber'),
        size: 80,
        cell: ({ getValue }) => (
          <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'date',
        header: t('quality.supervisionJournal.colDate'),
        size: 110,
        cell: ({ getValue }) => (
          <span className="tabular-nums">{formatDate(getValue<string>())}</span>
        ),
      },
      {
        accessorKey: 'inspectorName',
        header: t('quality.supervisionJournal.colInspector'),
        size: 160,
        cell: ({ getValue }) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'workType',
        header: t('quality.supervisionJournal.colWorkType'),
        size: 180,
      },
      {
        accessorKey: 'remarks',
        header: t('quality.supervisionJournal.colRemarks'),
        size: 200,
        cell: ({ getValue }) => (
          <span
            className="text-sm text-neutral-600 dark:text-neutral-400 truncate block max-w-[200px]"
            title={getValue<string>()}
          >
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'directives',
        header: t('quality.supervisionJournal.colDirectives'),
        size: 200,
        cell: ({ getValue }) => (
          <span
            className="text-sm text-neutral-600 dark:text-neutral-400 truncate block max-w-[200px]"
            title={getValue<string>()}
          >
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'complianceStatus',
        header: t('quality.supervisionJournal.colCompliance'),
        size: 150,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={complianceColorMap}
            label={complianceLabels[getValue<string>()]}
          />
        ),
      },
      {
        accessorKey: 'projectName',
        header: t('quality.supervisionJournal.colProject'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            {getValue<string>()}
          </span>
        ),
      },
    ];
  }, []);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('quality.supervisionJournal.title')}
        subtitle={t('quality.supervisionJournal.subtitle', {
          count: String(entries.length),
        })}
        breadcrumbs={[
          { label: t('quality.supervisionJournal.breadcrumbHome'), href: '/' },
          { label: t('quality.supervisionJournal.breadcrumbQuality'), href: '/quality' },
          { label: t('quality.supervisionJournal.breadcrumbSupervision') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => setShowModal(true)}>
            {t('quality.supervisionJournal.btnNewEntry')}
          </Button>
        }
        tabs={[
          { id: 'all', label: t('quality.supervisionJournal.tabAll'), count: tabCounts.all },
          {
            id: 'compliant',
            label: t('quality.supervisionJournal.tabCompliant'),
            count: tabCounts.compliant,
          },
          {
            id: 'non_compliant',
            label: t('quality.supervisionJournal.tabNonCompliant'),
            count: tabCounts.non_compliant,
          },
          {
            id: 'partial',
            label: t('quality.supervisionJournal.tabPartial'),
            count: tabCounts.partial,
          },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('quality.supervisionJournal.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={[
            { value: '', label: t('quality.supervisionJournal.filterAllStatuses') },
            ...Object.entries(getComplianceLabels()).map(([v, l]) => ({
              value: v,
              label: l,
            })),
          ]}
          value={complianceFilter}
          onChange={(e) => setComplianceFilter(e.target.value)}
          className="w-48"
        />
        <Input
          type="date"
          placeholder={t('quality.supervisionJournal.dateFrom')}
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="w-36"
        />
        <Input
          type="date"
          placeholder={t('quality.supervisionJournal.dateTo')}
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="w-36"
        />
      </div>

      {/* Table */}
      <DataTable<SupervisionEntry>
        data={filteredEntries}
        columns={columns}
        loading={isLoading}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('quality.supervisionJournal.emptyTitle')}
        emptyDescription={t('quality.supervisionJournal.emptyDescription')}
      />

      {/* Create Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={t('quality.supervisionJournal.modalTitle')}
        description={t('quality.supervisionJournal.modalDescription')}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              {t('quality.supervisionJournal.btnCancel')}
            </Button>
            <Button onClick={handleCreate} loading={createMutation.isPending}>
              {t('quality.supervisionJournal.btnCreate')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('quality.supervisionJournal.labelDate')} required>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
              />
            </FormField>
            <FormField label={t('quality.supervisionJournal.labelInspector')} required>
              <Input
                placeholder={t('quality.supervisionJournal.placeholderInspector')}
                value={form.inspectorName}
                onChange={(e) =>
                  setForm((p) => ({ ...p, inspectorName: e.target.value }))
                }
              />
            </FormField>
          </div>
          <FormField label={t('quality.supervisionJournal.labelWorkType')} required>
            <Input
              placeholder={t('quality.supervisionJournal.placeholderWorkType')}
              value={form.workType}
              onChange={(e) => setForm((p) => ({ ...p, workType: e.target.value }))}
            />
          </FormField>
          <FormField label={t('quality.supervisionJournal.labelRemarks')}>
            <Textarea
              placeholder={t('quality.supervisionJournal.placeholderRemarks')}
              value={form.remarks}
              onChange={(e) => setForm((p) => ({ ...p, remarks: e.target.value }))}
              rows={3}
            />
          </FormField>
          <FormField label={t('quality.supervisionJournal.labelDirectives')}>
            <Textarea
              placeholder={t('quality.supervisionJournal.placeholderDirectives')}
              value={form.directives}
              onChange={(e) => setForm((p) => ({ ...p, directives: e.target.value }))}
              rows={3}
            />
          </FormField>
        </div>
      </Modal>
    </div>
  );
};

export default AuthorSupervisionJournalPage;
