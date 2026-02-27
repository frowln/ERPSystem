import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { PaginatedResponse } from '@/types';
import type { Counterparty } from '@/api/contracts';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Plus, ExternalLink, Search, Upload, X, FileText } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Textarea, Select } from '@/design-system/components/FormField';
import { projectsApi } from '@/api/projects';
import { contractsApi } from '@/api/contracts';
import { documentsApi } from '@/api/documents';
import { financeApi } from '@/api/finance';
import { suggestParties, isDadataConfigured } from '@/lib/dadata';
import { t } from '@/i18n';
import type { ProjectType, ProjectPriority, ProjectStatus } from '@/types';

// ---------------------------------------------------------------------------
// Custom type helpers
// ---------------------------------------------------------------------------
const CUSTOM_TYPES_KEY = 'privod-custom-project-types';

function getCustomTypes(): string[] {
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_TYPES_KEY) ?? '[]') as string[];
  } catch {
    return [];
  }
}

function saveCustomTypes(types: string[]) {
  localStorage.setItem(CUSTOM_TYPES_KEY, JSON.stringify(types));
}

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------
const projectSchema = z.object({
  code: z
    .string()
    .min(1, t('forms.project.validation.codeRequired'))
    .max(30, t('forms.common.maxChars', { count: '30' }))
    .regex(/^[А-Яа-яA-Za-z0-9._-]+$/, t('forms.project.validation.codeFormat')),
  name: z
    .string()
    .min(1, t('forms.project.validation.nameRequired'))
    .max(300, t('forms.common.maxChars', { count: '300' })),
  constructionKind: z
    .string()
    .min(1, t('forms.project.validation.constructionKindRequired')),
  type: z.string().optional(),
  status: z
    .enum(['DRAFT', 'PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'])
    .optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  description: z
    .string()
    .max(3000, t('forms.common.maxChars', { count: '3000' }))
    .optional(),
  plannedStartDate: z.string().optional(),
  plannedEndDate: z.string().optional(),
  customerName: z.string().min(1, t('forms.project.validation.customerRequired')),
  customerId: z.string().optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

// ---------------------------------------------------------------------------
// Static option lists
// ---------------------------------------------------------------------------
const constructionKindOptions = [
  { value: 'NEW_CONSTRUCTION', label: t('forms.project.constructionKinds.newConstruction') },
  { value: 'RECONSTRUCTION',   label: t('forms.project.constructionKinds.reconstruction') },
  { value: 'OVERHAUL',         label: t('forms.project.constructionKinds.overhaul') },
  { value: 'DEMOLITION',       label: t('forms.project.constructionKinds.demolition') },
  { value: 'TECH_REEQUIPMENT', label: t('forms.project.constructionKinds.techReequipment') },
];

const BUILTIN_TYPES = [
  { value: 'RESIDENTIAL',   label: t('forms.project.projectTypes.residential') },
  { value: 'COMMERCIAL',    label: t('forms.project.projectTypes.commercial') },
  { value: 'INDUSTRIAL',    label: t('forms.project.projectTypes.industrial') },
  { value: 'INFRASTRUCTURE', label: t('forms.project.projectTypes.infrastructure') },
  { value: 'RENOVATION',    label: t('forms.project.projectTypes.renovation') },
];

const statusOptions = [
  { value: 'DRAFT',       label: t('forms.project.statuses.draft') },
  { value: 'PLANNING',    label: t('forms.project.statuses.planning') },
  { value: 'IN_PROGRESS', label: t('forms.project.statuses.inProgress') },
  { value: 'ON_HOLD',     label: t('forms.project.statuses.onHold') },
  { value: 'COMPLETED',   label: t('forms.project.statuses.completed') },
  { value: 'CANCELLED',   label: t('forms.project.statuses.cancelled') },
];

// ---------------------------------------------------------------------------
// Document drop zone
// ---------------------------------------------------------------------------
interface StagedFile {
  localId: string;
  file: File;
  category: string;
}

const DOC_CATEGORY_OPTIONS = [
  { value: 'DRAWING',       label: 'Чертёж / DWG' },
  { value: 'ESTIMATE',      label: 'Смета' },
  { value: 'PERMIT',        label: 'Разреш. документ' },
  { value: 'CONTRACT',      label: 'Договор' },
  { value: 'SPECIFICATION', label: 'Спецификация' },
  { value: 'REPORT',        label: 'Отчёт' },
  { value: 'PROTOCOL',      label: 'Протокол' },
  { value: 'PHOTO',         label: 'Фото' },
  { value: 'OTHER',         label: 'Прочее' },
];

function guessDocCategory(filename: string): string {
  const lower = filename.toLowerCase();
  if (/смет|ssr|estimate/.test(lower)) return 'ESTIMATE';
  if (/dwg|чертеж|чертёж|plan|drawing/.test(lower)) return 'DRAWING';
  if (/разреш|permit|гпзу|gpzu|ssr/.test(lower)) return 'PERMIT';
  if (/договор|contract/.test(lower)) return 'CONTRACT';
  if (/спец|spec/.test(lower)) return 'SPECIFICATION';
  if (/фото|photo|jpg|jpeg|png/.test(lower)) return 'PHOTO';
  if (/протокол|protocol/.test(lower)) return 'PROTOCOL';
  return 'OTHER';
}

const DocumentDropZone: React.FC<{
  files: StagedFile[];
  onAdd: (files: StagedFile[]) => void;
  onRemove: (localId: string) => void;
  onCategoryChange: (localId: string, category: string) => void;
}> = ({ files, onAdd, onRemove, onCategoryChange }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileList = useCallback((list: FileList) => {
    const newFiles: StagedFile[] = Array.from(list).map((file) => ({
      localId: Math.random().toString(36).slice(2),
      file,
      category: guessDocCategory(file.name),
    }));
    onAdd(newFiles);
  }, [onAdd]);

  return (
    <div>
      <div
        onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files.length) handleFileList(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
          ${isDragging
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-neutral-300 dark:border-neutral-600 hover:border-primary-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
          }`}
      >
        <Upload size={28} className="mx-auto mb-3 text-neutral-400" />
        <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {t('forms.project.docsDropZone')}
        </p>
        <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
          {t('forms.project.docsDropZoneHint')}
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.dwg,.zip,.rar,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.svg,.7z"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) handleFileList(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {files.length > 0 && (
        <ul className="mt-3 space-y-2">
          {files.map((sf) => (
            <li
              key={sf.localId}
              className="flex items-center gap-2 bg-neutral-50 dark:bg-neutral-800 rounded-lg px-3 py-2"
            >
              <FileText size={15} className="text-neutral-400 shrink-0" />
              <span
                className="text-sm text-neutral-700 dark:text-neutral-300 flex-1 truncate min-w-0"
                title={sf.file.name}
              >
                {sf.file.name}
              </span>
              <span className="text-xs text-neutral-400 shrink-0 whitespace-nowrap">
                {(sf.file.size / 1024 / 1024).toFixed(1)} МБ
              </span>
              <select
                value={sf.category}
                onChange={(e) => onCategoryChange(sf.localId, e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="text-xs border border-neutral-200 dark:border-neutral-600 rounded px-2 py-1 bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 shrink-0"
              >
                {DOC_CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => onRemove(sf.localId)}
                className="text-neutral-400 hover:text-danger-500 transition-colors shrink-0"
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Type select with ability to add custom types
// ---------------------------------------------------------------------------
interface TypeSelectProps {
  value: string;
  onChange: (v: string) => void;
  hasError?: boolean;
}

const TypeSelectWithAdd: React.FC<TypeSelectProps> = ({ value, onChange, hasError }) => {
  const [customTypes, setCustomTypes] = useState<string[]>(getCustomTypes);
  const [showAddInput, setShowAddInput] = useState(false);
  const [newTypeValue, setNewTypeValue] = useState('');

  const allOptions = [
    ...BUILTIN_TYPES,
    ...customTypes.map((ct) => ({ value: ct, label: ct })),
  ];

  const handleAdd = () => {
    const trimmed = newTypeValue.trim();
    if (!trimmed) return;
    if (allOptions.some((o) => o.value === trimmed || o.label === trimmed)) return;
    const updated = [...customTypes, trimmed];
    saveCustomTypes(updated);
    setCustomTypes(updated);
    onChange(trimmed);
    setShowAddInput(false);
    setNewTypeValue('');
    toast.success(t('forms.project.customTypeAdded'));
  };

  return (
    <div>
      <select
        value={value}
        onChange={(e) => {
          if (e.target.value === '__ADD__') setShowAddInput(true);
          else onChange(e.target.value);
        }}
        className={`w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-neutral-900
          text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500
          ${hasError ? 'border-danger-500' : 'border-neutral-300 dark:border-neutral-600'}`}
      >
        <option value="">{t('forms.project.placeholderType')}</option>
        {allOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
        <option value="__ADD__">＋ {t('forms.project.addCustomType')}</option>
      </select>

      {showAddInput && (
        <div className="mt-2 flex items-center gap-2">
          <Input
            placeholder={t('forms.project.customTypePlaceholder')}
            value={newTypeValue}
            onChange={(e) => setNewTypeValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); handleAdd(); }
              if (e.key === 'Escape') { setShowAddInput(false); setNewTypeValue(''); }
            }}
            autoFocus
          />
          <Button type="button" size="sm" onClick={handleAdd} iconLeft={<Plus size={13} />}>
            {t('common.add')}
          </Button>
          <Button
            type="button" size="sm" variant="secondary"
            onClick={() => { setShowAddInput(false); setNewTypeValue(''); }}
          >
            {t('common.cancel')}
          </Button>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Counterparty picker
// ---------------------------------------------------------------------------
interface CounterpartyPickerProps {
  value: string;
  onChange: (name: string, id?: string) => void;
  hasError?: boolean;
}

const CounterpartyPicker: React.FC<CounterpartyPickerProps> = ({ value, onChange, hasError }) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [dadataSuggestions, setDadataSuggestions] = useState<{ name: string; inn: string }[]>([]);

  const { data: counterpartiesData } = useQuery<PaginatedResponse<Counterparty>>({
    queryKey: ['counterparties', 'search', search],
    queryFn: () => contractsApi.getCounterparties({ search: search || undefined, size: 20 }),
    enabled: open,
  });

  const options = counterpartiesData?.content ?? [];

  useEffect(() => {
    if (!open || options.length > 0 || search.length < 3 || !isDadataConfigured()) {
      if (options.length > 0) setDadataSuggestions([]);
      return;
    }
    let cancelled = false;
    suggestParties(search, 5).then((suggestions) => {
      if (cancelled) return;
      setDadataSuggestions(
        suggestions.map((s) => ({
          name: s.data.name.short_with_opf ?? s.value,
          inn: s.data.inn,
        })),
      );
    });
    return () => { cancelled = true; };
  }, [open, options.length, search]);

  return (
    <div className="relative">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
        <input
          type="text"
          value={value}
          onChange={(e) => { onChange(e.target.value, undefined); setSearch(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={t('forms.project.placeholderCustomer')}
          className={`w-full rounded-lg border pl-9 pr-3 py-2 text-sm bg-white dark:bg-neutral-900
            text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500
            ${hasError ? 'border-danger-500' : 'border-neutral-300 dark:border-neutral-600'}`}
        />
      </div>

      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white dark:bg-neutral-900
          border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg max-h-52 overflow-y-auto">
          {options.length === 0 && dadataSuggestions.length === 0 ? (
            <div className="px-3 py-4 text-center">
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">
                {t('counterparties.emptyState')}
              </p>
              <button
                type="button"
                onClick={() => navigate('/counterparties/new')}
                className="text-sm text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center gap-1"
              >
                <Plus size={13} />
                {t('counterparties.createNew')}
              </button>
            </div>
          ) : (
            <>
              {options.map((cp) => (
                <button
                  key={cp.id}
                  type="button"
                  onMouseDown={() => { onChange(cp.name, cp.id); setDadataSuggestions([]); setOpen(false); }}
                  className="w-full text-left px-3 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{cp.name}</p>
                  {cp.inn && <p className="text-xs text-neutral-500 dark:text-neutral-400">ИНН: {cp.inn}</p>}
                </button>
              ))}
              {dadataSuggestions.length > 0 && (
                <>
                  <div className="px-3 py-1 text-xs text-neutral-400 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800">
                    Из реестра ФНС (Dadata)
                  </div>
                  {dadataSuggestions.map((s) => (
                    <button
                      key={s.inn}
                      type="button"
                      onMouseDown={() => {
                        // Оптимистично выставляем имя; id придёт после авто-создания контрагента
                        onChange(s.name, undefined);
                        setDadataSuggestions([]);
                        setOpen(false);
                        contractsApi.createCounterparty({ name: s.name, inn: s.inn })
                          .then((cp) => onChange(s.name, cp.id))
                          .catch(() => { /* не фатально — контрагент создастся вручную */ });
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    >
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{s.name}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">ИНН: {s.inn} · будет добавлен в контрагенты</p>
                    </button>
                  ))}
                </>
              )}
              <div className="border-t border-neutral-100 dark:border-neutral-800 px-3 py-2">
                <button
                  type="button"
                  onMouseDown={() => navigate('/counterparties/new')}
                  className="text-xs text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center gap-1"
                >
                  <Plus size={11} />
                  {t('counterparties.createNew')}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
        <button
          type="button"
          onClick={() => navigate('/counterparties')}
          className="text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center gap-1"
        >
          <ExternalLink size={11} />
          {t('counterparties.goToRegistry')}
        </button>
      </p>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main form
// ---------------------------------------------------------------------------
const ProjectFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);

  const { data: existingProject } = useQuery({
    queryKey: ['PROJECT', id],
    queryFn: () => projectsApi.getProject(id!),
    enabled: isEdit,
  });

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: existingProject
      ? {
          code: existingProject.category ?? '',
          name: existingProject.name,
          constructionKind: (existingProject as any).constructionKind ?? '',
          type: existingProject.type as string ?? '',
          status: existingProject.status as ProjectStatus,
          address: existingProject.address ?? '',
          city: existingProject.city ?? '',
          region: existingProject.region ?? '',
          description: existingProject.description ?? '',
          plannedStartDate: existingProject.plannedStartDate ?? '',
          plannedEndDate: existingProject.plannedEndDate ?? '',
          customerName: existingProject.customerName ?? '',
          customerId: existingProject.customerId ?? '',
        }
      : {
          code: '',
          name: '',
          constructionKind: '',
          type: '',
          status: 'PLANNING' as ProjectStatus,
          address: '',
          city: '',
          region: '',
          description: '',
          plannedStartDate: '',
          plannedEndDate: '',
          customerName: '',
          customerId: '',
        },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ProjectFormData) => {
      const project = await projectsApi.createProject({
        name: data.name,
        description: data.description || undefined,
        type: data.type as ProjectType || undefined,
        priority: 'NORMAL' as ProjectPriority,
        plannedStartDate: data.plannedStartDate || undefined,
        plannedEndDate: data.plannedEndDate || undefined,
        address: data.address || undefined,
        city: data.city || undefined,
        region: data.region || undefined,
        customerId: data.customerId || undefined,
        category: data.code || undefined,
        constructionKind: data.constructionKind || undefined,
      });

      // Upload staged documents (non-blocking — failures are logged, not fatal)
      const total = stagedFiles.length;
      for (let i = 0; i < total; i++) {
        const sf = stagedFiles[i];
        try {
          toast.loading(
            t('forms.project.docsUploadProgress', { current: String(i + 1), total: String(total) }),
            { id: 'doc-upload' },
          );
          const doc = await documentsApi.createDocument({
            title: sf.file.name.replace(/\.[^.]+$/, ''),
            category: sf.category,
            projectId: project.id,
            fileName: sf.file.name,
            fileSize: sf.file.size,
            mimeType: sf.file.type || 'application/octet-stream',
          });
          await documentsApi.uploadDocumentFile(doc.id, sf.file);
        } catch (err) {
          console.warn('[createProject] Failed to upload document:', sf.file.name, err);
        }
      }
      if (total > 0) toast.dismiss('doc-upload');

      // Auto-create FM (Financial Model) for the project
      let budgetId: string | undefined;
      try {
        const budget = await financeApi.createBudget({
          name: `ФМ — ${project.name}`,
          projectId: project.id,
          plannedRevenue: 0,
          plannedCost: 0,
        } as any);
        budgetId = budget?.id;
      } catch (err) {
        console.warn('[createProject] Auto-FM creation failed (non-fatal):', err);
      }

      // Auto-create КП (Commercial Proposal) linked to the FM
      if (budgetId) {
        try {
          await financeApi.createCommercialProposal({
            budgetId,
            name: `КП — ${project.name}`,
          });
        } catch (err) {
          console.warn('[createProject] Auto-КП creation failed (non-fatal):', err);
        }
      }

      // Set project status to PLANNING (pre-construction phase)
      try {
        await projectsApi.changeStatus(project.id, 'PLANNING' as ProjectStatus);
      } catch (err) {
        console.warn('[createProject] Auto-status change failed (non-fatal):', err);
      }

      return project;
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success(t('forms.project.createSuccess'));
      navigate(`/projects/${created.id}`);
    },
    onError: (err: any) => {
      const status = err?.response?.status;
      const serverMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        (typeof err?.response?.data === 'string' ? err.response.data : null) ||
        err?.message;
      const display = [status ? `HTTP ${status}` : null, serverMsg].filter(Boolean).join(' — ');
      toast.error(display || t('forms.project.createError'), { duration: 8000 });
      console.error('[createProject]', status, err?.response?.data ?? err);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: ProjectFormData) =>
      projectsApi.updateProject(id!, {
        name: data.name,
        description: data.description || undefined,
        type: data.type as ProjectType || undefined,
        status: data.status as ProjectStatus || undefined,
        plannedStartDate: data.plannedStartDate || undefined,
        plannedEndDate: data.plannedEndDate || undefined,
        address: data.address || undefined,
        city: data.city || undefined,
        region: data.region || undefined,
        customerId: data.customerId || undefined,
        category: data.code || undefined,
        constructionKind: data.constructionKind || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['PROJECT', id] });
      toast.success(t('forms.project.updateSuccess'));
      navigate(`/projects/${id}`);
    },
    onError: (err: any) => {
      const status = err?.response?.status;
      const serverMsg = err?.response?.data?.message || err?.message;
      toast.error(`${status ? `HTTP ${status} — ` : ''}${serverMsg || t('forms.project.updateError')}`, {
        duration: 6000,
      });
      console.error('[updateProject]', err?.response?.data ?? err);
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (data: ProjectFormData) => {
    if (isEdit) updateMutation.mutate(data);
    else createMutation.mutate(data);
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="animate-fade-in">
      <PageHeader
        title={isEdit ? t('forms.project.editTitle') : t('forms.project.createTitle')}
        subtitle={isEdit ? existingProject?.name : t('forms.project.createSubtitle')}
        backTo={isEdit ? `/projects/${id}` : '/projects'}
        breadcrumbs={[
          { label: t('forms.common.home'), href: '/' },
          { label: t('forms.project.breadcrumbProjects'), href: '/projects' },
          { label: isEdit ? t('forms.common.editing') : t('forms.common.creating') },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl">

        {/* ── Блок 1: Основная информация ── */}
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">
            {t('forms.project.sectionBasic')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

            {/* Шифр */}
            <FormField label={t('forms.project.labelCode')} error={errors.code?.message} required>
              <Input
                placeholder={t('forms.project.placeholderCode')}
                hasError={!!errors.code}
                {...register('code')}
              />
            </FormField>

            {/* Название */}
            <FormField
              label={t('forms.project.labelName')}
              error={errors.name?.message}
              required
              className="sm:col-span-2"
            >
              <Input
                placeholder={t('forms.project.placeholderName')}
                hasError={!!errors.name}
                {...register('name')}
              />
            </FormField>

            {/* Вид строительства */}
            <FormField
              label={t('forms.project.labelConstructionKind')}
              error={errors.constructionKind?.message}
              required
            >
              <Select
                options={constructionKindOptions}
                placeholder={t('forms.project.placeholderConstructionKind')}
                hasError={!!errors.constructionKind}
                {...register('constructionKind')}
              />
              <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500 leading-relaxed">
                {t('forms.project.hintConstructionKind')}
              </p>
            </FormField>

            {/* Тип объекта */}
            <FormField label={t('forms.project.labelType')} error={errors.type?.message}>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <TypeSelectWithAdd
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    hasError={!!errors.type}
                  />
                )}
              />
              <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500 leading-relaxed">
                {t('forms.project.hintType')}
              </p>
            </FormField>

            {/* Статус — только в режиме редактирования */}
            {isEdit && (
              <FormField label={t('forms.project.labelStatus')} error={errors.status?.message}>
                <Select
                  options={statusOptions}
                  placeholder={t('forms.project.placeholderStatus')}
                  hasError={!!errors.status}
                  {...register('status')}
                />
              </FormField>
            )}

            {/* Описание */}
            <FormField
              label={t('common.description')}
              error={errors.description?.message}
              className="sm:col-span-2"
            >
              <Textarea
                placeholder={t('forms.project.placeholderDescription')}
                rows={3}
                hasError={!!errors.description}
                {...register('description')}
              />
            </FormField>
          </div>
        </section>

        {/* ── Блок 2: Адрес ── */}
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">
            {t('forms.project.sectionAddress')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('forms.project.labelRegion')} error={errors.region?.message}>
              <Input
                placeholder={t('forms.project.placeholderRegion')}
                hasError={!!errors.region}
                {...register('region')}
              />
            </FormField>
            <FormField label={t('forms.project.labelCity')} error={errors.city?.message}>
              <Input
                placeholder={t('forms.project.placeholderCity')}
                hasError={!!errors.city}
                {...register('city')}
              />
            </FormField>
            <FormField
              label={t('forms.project.labelAddress')}
              error={errors.address?.message}
              className="sm:col-span-2"
            >
              <Input
                placeholder={t('forms.project.placeholderAddress')}
                hasError={!!errors.address}
                {...register('address')}
              />
            </FormField>
          </div>
        </section>

        {/* ── Блок 3: Участники ── */}
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">
            {t('forms.project.sectionParticipants')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField
              label={t('forms.project.labelCustomer')}
              error={errors.customerName?.message}
              required
              className="sm:col-span-2"
            >
              <Controller
                name="customerName"
                control={control}
                render={({ field }) => (
                  <CounterpartyPicker
                    value={field.value ?? ''}
                    onChange={(name, cpId) => {
                      field.onChange(name);
                      setValue('customerId', cpId ?? '');
                    }}
                    hasError={!!errors.customerName}
                  />
                )}
              />
            </FormField>
          </div>
        </section>

        {/* ── Блок 4: Сроки (опционально) ── */}
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
            {t('forms.project.sectionDates')}
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-5">
            Можно указать позже после составления графика работ.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('forms.project.labelPlannedStart')} error={errors.plannedStartDate?.message}>
              <Input type="date" hasError={!!errors.plannedStartDate} {...register('plannedStartDate')} />
            </FormField>
            <FormField label={t('forms.project.labelPlannedEnd')} error={errors.plannedEndDate?.message}>
              <Input type="date" hasError={!!errors.plannedEndDate} {...register('plannedEndDate')} />
            </FormField>
          </div>
        </section>

        {/* ── Блок 5: Проектная документация (только при создании) ── */}
        {!isEdit && (
          <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-8">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
              {t('forms.project.sectionDocs')}
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-5">
              {t('forms.project.sectionDocsHint')}
            </p>
            <DocumentDropZone
              files={stagedFiles}
              onAdd={(newFiles) => setStagedFiles((prev) => [...prev, ...newFiles])}
              onRemove={(localId) => setStagedFiles((prev) => prev.filter((f) => f.localId !== localId))}
              onCategoryChange={(localId, category) =>
                setStagedFiles((prev) =>
                  prev.map((f) => (f.localId === localId ? { ...f, category } : f)),
                )
              }
            />
          </section>
        )}

        {/* ── Actions ── */}
        <div className="flex items-center gap-3">
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? t('forms.common.saveChanges') : t('forms.project.createButton')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(isEdit ? `/projects/${id}` : '/projects')}
          >
            {t('common.cancel')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProjectFormPage;
