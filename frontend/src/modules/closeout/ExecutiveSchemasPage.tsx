import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Upload,
  Eye,
  Link2,
  FileImage,
  Search,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Modal } from '@/design-system/components/Modal';
import { Input, Select } from '@/design-system/components/FormField';
import { closeoutApi } from '@/api/closeout';
import { formatDate } from '@/lib/format';
import { t } from '@/i18n';
import type { ExecutiveSchema, ExecutiveSchemaStatus } from './types';

const statusColorMap: Record<string, 'gray' | 'green' | 'blue'> = {
  draft: 'gray',
  approved: 'green',
  archived: 'blue',
};

const getStatusLabel = (status: ExecutiveSchemaStatus): string => {
  switch (status) {
    case 'draft':
      return t('closeout.execSchemaStatusDraft');
    case 'approved':
      return t('closeout.execSchemaStatusApproved');
    case 'archived':
      return t('closeout.execSchemaStatusArchived');
    default:
      return status;
  }
};

type TabId = 'all' | 'draft' | 'approved' | 'archived';

const WORK_TYPES = [
  'concrete',
  'steel',
  'piping',
  'electrical',
  'hvac',
  'finishing',
  'earthwork',
  'other',
] as const;

const getWorkTypeLabel = (wt: string): string => {
  switch (wt) {
    case 'concrete':
      return t('closeout.execSchemaWorkTypeConcrete');
    case 'steel':
      return t('closeout.execSchemaWorkTypeSteel');
    case 'piping':
      return t('closeout.execSchemaWorkTypePiping');
    case 'electrical':
      return t('closeout.execSchemaWorkTypeElectrical');
    case 'hvac':
      return t('closeout.execSchemaWorkTypeHvac');
    case 'finishing':
      return t('closeout.execSchemaWorkTypeFinishing');
    case 'earthwork':
      return t('closeout.execSchemaWorkTypeEarthwork');
    case 'other':
      return t('closeout.execSchemaWorkTypeOther');
    default:
      return wt;
  }
};

interface UploadFormData {
  schemaName: string;
  workType: string;
  file: File | null;
}

const emptyUploadForm: UploadFormData = {
  schemaName: '',
  workType: '',
  file: null,
};

const ExecutiveSchemasPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [workTypeFilter, setWorkTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [previewSchema, setPreviewSchema] = useState<ExecutiveSchema | null>(null);
  const [linkModal, setLinkModal] = useState<ExecutiveSchema | null>(null);
  const [bimElementId, setBimElementId] = useState('');
  const [uploadForm, setUploadForm] = useState<UploadFormData>(emptyUploadForm);

  const { data: schemas = [], isLoading } = useQuery({
    queryKey: ['executive-schemas'],
    queryFn: () => closeoutApi.getExecutiveSchemas(),
  });

  const uploadMutation = useMutation({
    mutationFn: ({ file, metadata }: { file: File; metadata: { schemaName: string; workType: string } }) =>
      closeoutApi.uploadExecutiveSchema(file, metadata),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['executive-schemas'] });
      setShowUploadModal(false);
      setUploadForm(emptyUploadForm);
      toast.success(t('closeout.execSchemaUploadSuccess'));
    },
    onError: () => {
      toast.error(t('closeout.execSchemaUploadError'));
    },
  });

  const linkMutation = useMutation({
    mutationFn: ({ schemaId, bimId }: { schemaId: string; bimId: string }) =>
      closeoutApi.linkSchemaToModel(schemaId, bimId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['executive-schemas'] });
      setLinkModal(null);
      setBimElementId('');
      toast.success(t('closeout.execSchemaLinkSuccess'));
    },
    onError: () => {
      toast.error(t('closeout.execSchemaLinkError'));
    },
  });

  const filtered = useMemo(() => {
    let result = schemas;

    if (activeTab !== 'all') {
      result = result.filter((s) => s.status === activeTab);
    }

    if (workTypeFilter) {
      result = result.filter((s) => s.workType === workTypeFilter);
    }

    if (statusFilter) {
      result = result.filter((s) => s.status === statusFilter);
    }

    if (search.trim()) {
      const lower = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.schemaName.toLowerCase().includes(lower) ||
          s.workType.toLowerCase().includes(lower) ||
          (s.linkedBimElementName ?? '').toLowerCase().includes(lower),
      );
    }

    return result;
  }, [schemas, activeTab, workTypeFilter, statusFilter, search]);

  const counts = useMemo(
    () => ({
      all: schemas.length,
      draft: schemas.filter((s) => s.status === 'draft').length,
      approved: schemas.filter((s) => s.status === 'approved').length,
      archived: schemas.filter((s) => s.status === 'archived').length,
    }),
    [schemas],
  );

  const handleUpload = useCallback(() => {
    if (!uploadForm.file || !uploadForm.schemaName || !uploadForm.workType) return;
    uploadMutation.mutate({
      file: uploadForm.file,
      metadata: { schemaName: uploadForm.schemaName, workType: uploadForm.workType },
    });
  }, [uploadForm, uploadMutation]);

  const handleLink = useCallback(() => {
    if (!linkModal || !bimElementId) return;
    linkMutation.mutate({ schemaId: linkModal.id, bimId: bimElementId });
  }, [linkModal, bimElementId, linkMutation]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setUploadForm((prev) => ({ ...prev, file }));
  }, []);

  const columns = useMemo<ColumnDef<ExecutiveSchema, unknown>[]>(
    () => [
      {
        accessorKey: 'schemaName',
        header: t('closeout.execSchemaColName'),
        size: 260,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[240px]">
              {row.original.schemaName}
            </p>
            {row.original.fileUrl && (
              <p className="text-xs text-primary-500 dark:text-primary-400 mt-0.5 flex items-center gap-1">
                <FileImage size={12} />
                PDF/DWG
              </p>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'workType',
        header: t('closeout.execSchemaColWorkType'),
        size: 160,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300">
            {getWorkTypeLabel(getValue<string>())}
          </span>
        ),
      },
      {
        accessorKey: 'createdDate',
        header: t('closeout.execSchemaColCreatedDate'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-600 dark:text-neutral-400">
            {formatDate(getValue<string>())}
          </span>
        ),
      },
      {
        accessorKey: 'linkedBimElementName',
        header: t('closeout.execSchemaColBimElement'),
        size: 200,
        cell: ({ row }) => {
          const name = row.original.linkedBimElementName;
          return name ? (
            <div className="flex items-center gap-1 text-sm text-primary-600 dark:text-primary-400">
              <Link2 size={14} />
              <span className="truncate max-w-[160px]">{name}</span>
            </div>
          ) : (
            <span className="text-neutral-400">{'\u2014'}</span>
          );
        },
      },
      {
        accessorKey: 'status',
        header: t('closeout.execSchemaColStatus'),
        size: 120,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={statusColorMap}
            label={getStatusLabel(getValue<ExecutiveSchemaStatus>())}
          />
        ),
      },
      {
        id: 'actions',
        header: '',
        size: 160,
        cell: ({ row }) => (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="xs"
              iconLeft={<Eye size={14} />}
              onClick={(e) => {
                e.stopPropagation();
                setPreviewSchema(row.original);
              }}
            >
              {t('closeout.execSchemaPreview')}
            </Button>
            <Button
              variant="ghost"
              size="xs"
              iconLeft={<Link2 size={14} />}
              onClick={(e) => {
                e.stopPropagation();
                setLinkModal(row.original);
              }}
            >
              BIM
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  const workTypeOptions = useMemo(
    () => [
      { value: '', label: t('closeout.execSchemaAllWorkTypes') },
      ...WORK_TYPES.map((wt) => ({ value: wt, label: getWorkTypeLabel(wt) })),
    ],
    [],
  );

  const statusOptions = useMemo(
    () => [
      { value: '', label: t('closeout.execSchemaAllStatuses') },
      { value: 'draft', label: getStatusLabel('draft') },
      { value: 'approved', label: getStatusLabel('approved') },
      { value: 'archived', label: getStatusLabel('archived') },
    ],
    [],
  );

  const uploadWorkTypeOptions = useMemo(
    () => [
      { value: '', label: '\u2014' },
      ...WORK_TYPES.map((wt) => ({ value: wt, label: getWorkTypeLabel(wt) })),
    ],
    [],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('closeout.execSchemaTitle')}
        subtitle={t('closeout.execSchemaSubtitle')}
        breadcrumbs={[
          { label: t('closeout.breadcrumbHome'), href: '/' },
          { label: t('closeout.breadcrumbCloseout'), href: '/closeout/dashboard' },
          { label: t('closeout.execSchemaTitle') },
        ]}
        actions={
          <Button
            iconLeft={<Upload size={16} />}
            onClick={() => {
              setUploadForm(emptyUploadForm);
              setShowUploadModal(true);
            }}
          >
            {t('closeout.execSchemaUpload')}
          </Button>
        }
        tabs={[
          { id: 'all', label: t('common.all'), count: counts.all },
          { id: 'draft', label: t('closeout.execSchemaStatusDraft'), count: counts.draft },
          { id: 'approved', label: t('closeout.execSchemaStatusApproved'), count: counts.approved },
          { id: 'archived', label: t('closeout.execSchemaStatusArchived'), count: counts.archived },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('closeout.execSchemaSearchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={workTypeOptions}
          value={workTypeFilter}
          onChange={(e) => setWorkTypeFilter(e.target.value)}
          className="w-48"
        />
        <Select
          options={statusOptions}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-40"
        />
      </div>

      <DataTable<ExecutiveSchema>
        data={filtered}
        columns={columns}
        loading={isLoading}
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('closeout.execSchemaEmpty')}
        emptyDescription={t('closeout.execSchemaEmptyDesc')}
      />

      {/* Upload Modal */}
      <Modal
        open={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title={t('closeout.execSchemaUploadTitle')}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t('closeout.execSchemaFieldName')} *
            </label>
            <Input
              value={uploadForm.schemaName}
              onChange={(e) =>
                setUploadForm((prev) => ({ ...prev, schemaName: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t('closeout.execSchemaFieldWorkType')} *
            </label>
            <Select
              options={uploadWorkTypeOptions}
              value={uploadForm.workType}
              onChange={(e) =>
                setUploadForm((prev) => ({ ...prev, workType: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t('closeout.execSchemaFieldFile')} * (PDF/DWG)
            </label>
            <input
              type="file"
              accept=".pdf,.dwg"
              onChange={handleFileChange}
              className="block w-full text-sm text-neutral-500 dark:text-neutral-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-primary-50 file:text-primary-700
                dark:file:bg-primary-900/30 dark:file:text-primary-300
                hover:file:bg-primary-100 dark:hover:file:bg-primary-900/50"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowUploadModal(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleUpload}
              disabled={
                !uploadForm.schemaName || !uploadForm.workType || !uploadForm.file
              }
              loading={uploadMutation.isPending}
            >
              {t('closeout.execSchemaUpload')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Preview Modal */}
      <Modal
        open={!!previewSchema}
        onClose={() => setPreviewSchema(null)}
        title={t('closeout.execSchemaPreviewTitle')}
      >
        {previewSchema && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-y-3 text-sm">
              <span className="text-neutral-500 dark:text-neutral-400">
                {t('closeout.execSchemaColName')}:
              </span>
              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                {previewSchema.schemaName}
              </span>

              <span className="text-neutral-500 dark:text-neutral-400">
                {t('closeout.execSchemaColWorkType')}:
              </span>
              <span className="text-neutral-900 dark:text-neutral-100">
                {getWorkTypeLabel(previewSchema.workType)}
              </span>

              <span className="text-neutral-500 dark:text-neutral-400">
                {t('closeout.execSchemaColCreatedDate')}:
              </span>
              <span className="tabular-nums text-neutral-900 dark:text-neutral-100">
                {formatDate(previewSchema.createdDate)}
              </span>

              <span className="text-neutral-500 dark:text-neutral-400">
                {t('closeout.execSchemaColStatus')}:
              </span>
              <StatusBadge
                status={previewSchema.status}
                colorMap={statusColorMap}
                label={getStatusLabel(previewSchema.status)}
              />

              <span className="text-neutral-500 dark:text-neutral-400">
                {t('closeout.execSchemaColBimElement')}:
              </span>
              <span className="text-neutral-900 dark:text-neutral-100">
                {previewSchema.linkedBimElementName || '\u2014'}
              </span>
            </div>

            {previewSchema.fileUrl ? (
              <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg p-8 flex items-center justify-center border border-neutral-200 dark:border-neutral-700">
                <div className="text-center">
                  <FileImage
                    size={48}
                    className="mx-auto text-neutral-400 dark:text-neutral-500 mb-2"
                  />
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {t('closeout.execSchemaPreviewPlaceholder')}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg p-8 flex items-center justify-center">
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {t('closeout.execSchemaNoFile')}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Link to BIM Modal */}
      <Modal
        open={!!linkModal}
        onClose={() => {
          setLinkModal(null);
          setBimElementId('');
        }}
        title={t('closeout.execSchemaLinkTitle')}
      >
        {linkModal && (
          <div className="space-y-4">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {t('closeout.execSchemaLinkDesc', { name: linkModal.schemaName })}
            </p>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                {t('closeout.execSchemaFieldBimId')} *
              </label>
              <Input
                value={bimElementId}
                onChange={(e) => setBimElementId(e.target.value)}
                placeholder={t('closeout.execSchemaFieldBimPlaceholder')}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setLinkModal(null);
                  setBimElementId('');
                }}
              >
                {t('common.cancel')}
              </Button>
              <Button
                iconLeft={<Link2 size={16} />}
                onClick={handleLink}
                disabled={!bimElementId}
                loading={linkMutation.isPending}
              >
                {t('closeout.execSchemaLinkAction')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ExecutiveSchemasPage;
