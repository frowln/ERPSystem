import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  PlusCircle,
  Search,
  FileCheck2,
  FilePen,
  FileArchive,
  ClipboardList,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Button } from '@/design-system/components/Button';
import { Modal } from '@/design-system/components/Modal';
import { FormField, Input, Select } from '@/design-system/components/FormField';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { execDocsApi } from '@/api/execDocs';
import { projectsApi } from '@/api/projects';
import { formatDate } from '@/lib/format';
import { t } from '@/i18n';
import toast from 'react-hot-toast';
import type { AosrRecord, AosrStatus } from './types';

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------

const aosrStatusColorMap: Record<string, string> = {
  draft: 'gray',
  signed: 'green',
  archived: 'blue',
};

type TabId = 'all' | 'draft' | 'signed' | 'archived';

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

const AosrPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  // Form state
  const [workType, setWorkType] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [contractor, setContractor] = useState('');
  const [inspector, setInspector] = useState('');
  const [designerRep, setDesignerRep] = useState('');
  const [clientRep, setClientRep] = useState('');
  const [nextWorkPermission, setNextWorkPermission] = useState('');
  const [projectId, setProjectId] = useState('');

  const { data: aosrData, isLoading } = useQuery({
    queryKey: ['aosr-list'],
    queryFn: () => execDocsApi.getAosrList(),
  });

  const { data: projects } = useQuery({
    queryKey: ['projects-select'],
    queryFn: () => projectsApi.getProjects({ size: 200 }),
  });

  const projectOptions = (projects?.content ?? []).map((p) => ({
    value: p.id,
    label: p.name,
  }));

  const documents = aosrData?.content ?? [];

  const filteredDocs = useMemo(() => {
    let filtered = documents;
    if (activeTab !== 'all') {
      filtered = filtered.filter((d) => d.status === activeTab);
    }
    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.number.toLowerCase().includes(lower) ||
          d.workType.toLowerCase().includes(lower) ||
          d.location.toLowerCase().includes(lower) ||
          d.contractor.toLowerCase().includes(lower),
      );
    }
    return filtered;
  }, [documents, activeTab, search]);

  const counts = useMemo(
    () => ({
      all: documents.length,
      draft: documents.filter((d) => d.status === 'draft').length,
      signed: documents.filter((d) => d.status === 'signed').length,
      archived: documents.filter((d) => d.status === 'archived').length,
    }),
    [documents],
  );

  const createMutation = useMutation({
    mutationFn: () =>
      execDocsApi.createAosr({
        workType,
        location,
        startDate,
        endDate,
        contractor,
        inspector,
        designerRepresentative: designerRep,
        clientRepresentative: clientRep,
        nextWorkPermission,
        projectId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aosr-list'] });
      toast.success(t('execDocs.aosr.toastCreated'));
      closeModal();
    },
    onError: () => toast.error(t('execDocs.aosr.toastCreateError')),
  });

  const closeModal = () => {
    setShowCreate(false);
    setWorkType('');
    setLocation('');
    setStartDate('');
    setEndDate('');
    setContractor('');
    setInspector('');
    setDesignerRep('');
    setClientRep('');
    setNextWorkPermission('');
    setProjectId('');
  };

  const handleCreate = useCallback(() => {
    if (!workType.trim()) {
      toast.error(t('execDocs.aosr.validationWorkType'));
      return;
    }
    if (!projectId) {
      toast.error(t('execDocs.aosr.validationProject'));
      return;
    }
    createMutation.mutate();
  }, [workType, projectId, createMutation]);

  const columns = useMemo<ColumnDef<AosrRecord, unknown>[]>(
    () => [
      {
        accessorKey: 'number',
        header: t('execDocs.aosr.colNumber'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="font-mono text-xs text-neutral-600 dark:text-neutral-400">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'workType',
        header: t('execDocs.aosr.colWorkType'),
        size: 240,
        cell: ({ getValue }) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100 text-sm">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'location',
        header: t('execDocs.aosr.colLocation'),
        size: 180,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300 text-sm">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'startDate',
        header: t('execDocs.aosr.colStartDate'),
        size: 110,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-sm">{formatDate(getValue<string>())}</span>
        ),
      },
      {
        accessorKey: 'endDate',
        header: t('execDocs.aosr.colEndDate'),
        size: 110,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-sm">{formatDate(getValue<string>())}</span>
        ),
      },
      {
        accessorKey: 'contractor',
        header: t('execDocs.aosr.colContractor'),
        size: 180,
        cell: ({ getValue }) => (
          <span className="text-neutral-600 dark:text-neutral-400 text-sm">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('execDocs.aosr.colStatus'),
        size: 130,
        cell: ({ getValue }) => {
          const status = getValue<AosrStatus>();
          return (
            <StatusBadge
              status={status}
              colorMap={aosrStatusColorMap}
              label={t(`execDocs.aosr.status${status.charAt(0).toUpperCase() + status.slice(1)}`)}
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
        title={t('execDocs.aosr.title')}
        subtitle={t('execDocs.aosr.subtitle')}
        breadcrumbs={[
          { label: t('execDocs.breadcrumbHome'), href: '/' },
          { label: t('execDocs.aosr.breadcrumb') },
        ]}
        tabs={[
          { id: 'all', label: t('execDocs.aosr.tabAll'), count: counts.all },
          { id: 'draft', label: t('execDocs.aosr.tabDraft'), count: counts.draft },
          { id: 'signed', label: t('execDocs.aosr.tabSigned'), count: counts.signed },
          { id: 'archived', label: t('execDocs.aosr.tabArchived'), count: counts.archived },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
        actions={
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <PlusCircle size={14} className="mr-1" />
            {t('execDocs.aosr.actionCreate')}
          </Button>
        }
      />

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<ClipboardList size={16} />}
          label={t('execDocs.aosr.metricTotal')}
          value={counts.all}
          compact
        />
        <MetricCard
          icon={<FilePen size={16} />}
          label={t('execDocs.aosr.metricDraft')}
          value={counts.draft}
          compact
        />
        <MetricCard
          icon={<FileCheck2 size={16} />}
          label={t('execDocs.aosr.metricSigned')}
          value={counts.signed}
          compact
        />
        <MetricCard
          icon={<FileArchive size={16} />}
          label={t('execDocs.aosr.metricArchived')}
          value={counts.archived}
          compact
        />
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('execDocs.aosr.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <DataTable<AosrRecord>
        data={filteredDocs}
        columns={columns}
        loading={isLoading}
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('execDocs.aosr.emptyTitle')}
        emptyDescription={t('execDocs.aosr.emptyDescription')}
      />

      {/* Create AOSR Modal */}
      <Modal
        open={showCreate}
        onClose={closeModal}
        title={t('execDocs.aosr.modalCreateTitle')}
        size="lg"
      >
        <div className="space-y-4">
          <FormField label={t('execDocs.aosr.fieldProject')} required>
            <Select
              options={projectOptions}
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              placeholder={t('execDocs.aosr.selectProjectPlaceholder')}
            />
          </FormField>

          <FormField label={t('execDocs.aosr.fieldWorkType')} required>
            <Input
              value={workType}
              onChange={(e) => setWorkType(e.target.value)}
              placeholder={t('execDocs.aosr.placeholderWorkType')}
            />
          </FormField>

          <FormField label={t('execDocs.aosr.fieldLocation')}>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t('execDocs.aosr.placeholderLocation')}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('execDocs.aosr.fieldStartDate')}>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </FormField>
            <FormField label={t('execDocs.aosr.fieldEndDate')}>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </FormField>
          </div>

          <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4">
            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
              {t('execDocs.aosr.sectionParticipants')}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <FormField label={t('execDocs.aosr.fieldContractor')}>
                <Input
                  value={contractor}
                  onChange={(e) => setContractor(e.target.value)}
                  placeholder={t('execDocs.aosr.placeholderContractor')}
                />
              </FormField>
              <FormField label={t('execDocs.aosr.fieldInspector')}>
                <Input
                  value={inspector}
                  onChange={(e) => setInspector(e.target.value)}
                  placeholder={t('execDocs.aosr.placeholderInspector')}
                />
              </FormField>
              <FormField label={t('execDocs.aosr.fieldDesignerRep')}>
                <Input
                  value={designerRep}
                  onChange={(e) => setDesignerRep(e.target.value)}
                  placeholder={t('execDocs.aosr.placeholderDesignerRep')}
                />
              </FormField>
              <FormField label={t('execDocs.aosr.fieldClientRep')}>
                <Input
                  value={clientRep}
                  onChange={(e) => setClientRep(e.target.value)}
                  placeholder={t('execDocs.aosr.placeholderClientRep')}
                />
              </FormField>
            </div>
          </div>

          <FormField label={t('execDocs.aosr.fieldNextWorkPermission')}>
            <Input
              value={nextWorkPermission}
              onChange={(e) => setNextWorkPermission(e.target.value)}
              placeholder={t('execDocs.aosr.placeholderNextWorkPermission')}
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={closeModal}>
              {t('common.cancel')}
            </Button>
            <Button loading={createMutation.isPending} onClick={handleCreate}>
              <PlusCircle size={14} className="mr-1" />
              {t('execDocs.aosr.actionCreate')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AosrPage;
