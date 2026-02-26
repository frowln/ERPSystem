import React, { useCallback, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '@/api/projects';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import { Plus, Trash2, Upload, FileSpreadsheet, AlertCircle, Info, FileUp, Tag } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Textarea, Select } from '@/design-system/components/FormField';
import { specificationsApi, type CreateSpecItemRequest, type ParsedSpecItem } from '@/api/specifications';
import { financeApi } from '@/api/finance';
import { t } from '@/i18n';
import type { SpecItemType } from '@/types';

// ─── Schema ─────────────────────────────────────────────────────────────────

const specificationSchema = z.object({
  name: z.string().min(1, t('forms.specification.validation.nameRequired')).max(300),
  projectId: z.string().min(1, t('forms.specification.validation.projectRequired')),
  status: z.enum(['DRAFT', 'IN_REVIEW', 'APPROVED', 'ACTIVE']),
  notes: z.string().max(2000).optional(),
});
type SpecificationFormData = z.input<typeof specificationSchema>;

// ─── LineItem type (one row in the editable table) ───────────────────────────

interface LineItem {
  position: string;        // Поз. из PDF (read-only display)
  sectionName: string;     // Раздел из PDF (для визуальной группировки)
  name: string;
  brand: string;           // Тип/Марка
  productCode: string;     // Код оборудования
  manufacturer: string;    // Завод-изготовитель
  quantity: string;
  unitOfMeasure: string;
  weight: string;          // Вес, кг
  itemType: SpecItemType;
  notes: string;
}

const emptyLine = (): LineItem => ({
  position: '',
  sectionName: '',
  name: '',
  brand: '',
  productCode: '',
  manufacturer: '',
  quantity: '',
  unitOfMeasure: 'шт',
  weight: '',
  itemType: 'EQUIPMENT',
  notes: '',
});

// ─── Static options ──────────────────────────────────────────────────────────

const ITEM_TYPE_OPTIONS: { value: SpecItemType; label: string }[] = [
  { value: 'EQUIPMENT', label: t('specifications.itemTypeEquipment') },
  { value: 'MATERIAL',  label: t('specifications.itemTypeMaterial') },
  { value: 'WORK',      label: t('specifications.itemTypeWork') },
];

const statusOptions = [
  { value: 'DRAFT',     label: t('forms.specification.statuses.draft') },
  { value: 'IN_REVIEW', label: t('forms.specification.statuses.inReview') },
  { value: 'APPROVED',  label: t('forms.specification.statuses.approved') },
  { value: 'ACTIVE',    label: t('forms.specification.statuses.active') },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function guessItemType(name: string, brand = ''): SpecItemType {
  const s = `${name} ${brand}`.toLowerCase();
  if (/монтаж|установка|прокладка|сборка|сварка|пуск|наладк|работ|услуг/.test(s)) return 'WORK';
  if (/труб|кабел|провод|лист|уголок|швеллер|арматур|краска|цемент|песок|щебень|утеплит/.test(s)) return 'MATERIAL';
  return 'EQUIPMENT';
}

/**
 * Parse a spec xlsx file. Supports:
 * - ГРАНД-Смета / ПД format: №|Наименование|Тип/Марка|Код|Завод|Ед.изм.|Кол-во|Вес|Примечание
 * - Any table where header row contains "наименован"
 */
function parseSpecXlsx(file: File): Promise<LineItem[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows: string[][] = (XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: '',
          raw: false,
        }) as unknown[][]).map((r) => r.map((c) => String(c ?? '').trim()));

        // ── Find header row ────────────────────────────────────────────────
        let hRow = -1;
        let nameCol = -1, brandCol = -1, codeCol = -1, mfgCol = -1,
            unitCol = -1, qtyCol = -1, weightCol = -1, noteCol = -1;

        for (let r = 0; r < Math.min(rows.length, 25); r++) {
          const row = rows[r].map((c) => c.toLowerCase());
          const ni = row.findIndex((c) =>
            c.includes('наименован') || c === 'name' || c.includes('название'),
          );
          if (ni < 0) continue;

          hRow = r;
          nameCol = ni;
          brandCol = row.findIndex((c) =>
            c.includes('тип') || c.includes('марк') || c === 'brand' || c.includes('модел'),
          );
          codeCol = row.findIndex((c) =>
            c.includes('код') || c.includes('артикул') || c === 'code',
          );
          mfgCol = row.findIndex((c) =>
            c.includes('завод') || c.includes('производ') || c.includes('изготов') || c === 'manufacturer',
          );
          unitCol = row.findIndex((c) =>
            (c.includes('ед') && c.includes('изм')) || c === 'ед.изм.' || c === 'unit',
          );
          qtyCol = row.findIndex((c) =>
            c.includes('кол') || c === 'qty' || c.includes('количеств'),
          );
          weightCol = row.findIndex((c) => c.includes('вес') || c === 'weight' || c === 'масс');
          noteCol = row.findIndex((c) =>
            c.includes('примечан') || c.includes('note') || c.includes('комментар'),
          );
          break;
        }

        if (hRow < 0 || nameCol < 0) {
          // Fallback: standard ПД spec column order
          // 0:№  1:Наименование  2:Тип/Марка  3:Код  4:Завод  5:Ед.изм.  6:Кол-во  7:Вес  8:Примечание
          hRow = 0;
          nameCol = 1; brandCol = 2; codeCol = 3; mfgCol = 4;
          unitCol = 5; qtyCol = 6;  weightCol = 7; noteCol = 8;
        }

        const col = (row: string[], idx: number) => (idx >= 0 ? row[idx] ?? '' : '');

        const items: LineItem[] = [];
        for (let r = hRow + 1; r < rows.length; r++) {
          const row = rows[r];
          const rawName = col(row, nameCol);
          if (!rawName || rawName.length < 2) continue;

          const rawQtyStr = col(row, qtyCol).replace(',', '.');
          const rawQty = parseFloat(rawQtyStr);
          const rawBrand = col(row, brandCol);
          const rawCode  = col(row, codeCol);
          const rawMfg   = col(row, mfgCol);
          const rawUnit  = col(row, unitCol) || 'шт';
          const rawWt    = col(row, weightCol).replace(',', '.');
          const rawNote  = col(row, noteCol);

          items.push({
            position: '',
            sectionName: '',
            name: rawName,
            brand: rawBrand,
            productCode: rawCode,
            manufacturer: rawMfg,
            quantity: isNaN(rawQty) || rawQty <= 0 ? '1' : String(rawQty),
            unitOfMeasure: rawUnit,
            weight: rawWt && !isNaN(parseFloat(rawWt)) ? String(parseFloat(rawWt)) : '',
            itemType: guessItemType(rawName, rawBrand),
            notes: rawNote,
          });
        }

        resolve(items);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

// ─── Component ───────────────────────────────────────────────────────────────

const SpecificationFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate  = useNavigate();
  const queryClient = useQueryClient();
  const isEdit  = !!id;
  const fileInputRef    = useRef<HTMLInputElement>(null);
  const pdfInputRef     = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver]   = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [autoFm, setAutoFm]           = useState(true);
  const [autoKp, setAutoKp]           = useState(true);
  const [isPdfParsing, setIsPdfParsing] = useState(false);

  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getProjects(),
  });
  const projectOptions = (projectsData?.content ?? []).map((p) => ({ value: p.id, label: p.name }));

  const [lineItems, setLineItems] = useState<LineItem[]>([emptyLine()]);

  const { data: existingSpec } = useQuery({
    queryKey: ['SPECIFICATION', id],
    queryFn: () => specificationsApi.getSpecification(id!),
    enabled: isEdit,
  });

  const {
    register, handleSubmit, watch,
    formState: { errors },
  } = useForm<SpecificationFormData>({
    resolver: zodResolver(specificationSchema),
    defaultValues: existingSpec
      ? { name: existingSpec.title ?? existingSpec.name, projectId: existingSpec.projectId, status: existingSpec.status, notes: existingSpec.notes ?? '' }
      : { name: '', projectId: '', status: 'DRAFT', notes: '' },
  });

  const watchProjectId = watch('projectId');

  // ── Handlers ──────────────────────────────────────────────────────────────

  const addLineItem = () => setLineItems((p) => [...p, emptyLine()]);

  const removeLineItem = (idx: number) => {
    if (lineItems.length > 1) setLineItems((p) => p.filter((_, i) => i !== idx));
  };

  const updateLineItem = (idx: number, field: keyof LineItem, value: string) =>
    setLineItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });

  const handleXlsxFile = useCallback(async (file: File) => {
    if (!file.name.match(/\.xlsx?$/i)) {
      setImportError(t('specifications.importXlsxWrongType'));
      return;
    }
    setImportError(null);
    try {
      const parsed = await parseSpecXlsx(file);
      if (parsed.length === 0) {
        setImportError(t('specifications.importXlsxNoRows'));
        return;
      }
      setLineItems(parsed);
      toast.success(t('specifications.importXlsxSuccess', { count: String(parsed.length) }));
    } catch {
      setImportError(t('specifications.importXlsxError'));
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleXlsxFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (file.name.match(/\.pdf$/i)) handlePdfFile(file);
    else handleXlsxFile(file);
  };

  const handlePdfFile = async (file: File) => {
    setImportError(null);
    setIsPdfParsing(true);
    try {
      const parsed: ParsedSpecItem[] = await specificationsApi.previewPdf(file);
      if (parsed.length === 0) {
        setImportError('В PDF не найдено ни одной позиции спецификации');
        return;
      }
      const items: LineItem[] = parsed.map((p) => ({
        position:      p.position ?? '',
        sectionName:   p.sectionName ?? '',
        name:          p.name ?? '',
        brand:         p.brand ?? '',
        productCode:   p.productCode ?? '',
        manufacturer:  p.manufacturer ?? '',
        quantity:      String(p.quantity ?? 1),
        unitOfMeasure: p.unitOfMeasure ?? 'шт',
        weight:        p.mass != null ? String(p.mass) : '',
        itemType:      (p.itemType as SpecItemType) ?? 'EQUIPMENT',
        notes:         p.notes ?? '',
      }));
      setLineItems(items);
      toast.success(`Из PDF импортировано ${items.length} позиций`);
    } catch {
      setImportError(t('specifications.importPdfError'));
    } finally {
      setIsPdfParsing(false);
    }
  };

  // ── Mutations ─────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: async (data: SpecificationFormData) => {
      // Resolve project display name for denormalization
      const selectedProject = (projectsData?.content ?? []).find((p) => p.id === data.projectId);
      const projectName = selectedProject?.name ?? '';

      // 1. Create spec header — `name` field becomes the user-visible title
      const spec = await specificationsApi.createSpecification({
        title:       data.name.trim(),
        projectName: projectName,
        projectId:   data.projectId,
        status:      data.status,
        notes:       data.notes,
      } as Parameters<typeof specificationsApi.createSpecification>[0]);

      // 2. Create spec items
      const validItems = lineItems.filter((li) => li.name.trim());
      const itemRequests: CreateSpecItemRequest[] = validItems.map((li, idx) => ({
        name:          li.name.trim(),
        brand:         li.brand.trim() || undefined,
        productCode:   li.productCode.trim() || undefined,
        manufacturer:  li.manufacturer.trim() || undefined,
        quantity:      parseFloat(li.quantity) || 1,
        unitOfMeasure: li.unitOfMeasure.trim() || 'шт',
        weight:        li.weight ? parseFloat(li.weight) || undefined : undefined,
        itemType:      li.itemType,
        notes:         li.notes.trim() || undefined,
        sequence:      idx + 1,
        position:      li.position.trim() || undefined,
        sectionName:   li.sectionName.trim() || undefined,
      }));

      const specItems = itemRequests.length > 0
        ? await specificationsApi.batchCreateSpecItems(spec.id, itemRequests)
        : [];

      // 3. Auto-push to FM — grouped by section (creates FM section headers)
      if (autoFm && specItems.length > 0) {
        try {
          const budgetsPage = await financeApi.getBudgets({ projectId: data.projectId, page: 0, size: 1 });
          const budget = budgetsPage.content?.[0];
          if (budget) {
            const CATEGORY: Record<string, string> = {
              EQUIPMENT: 'EQUIPMENT',
              MATERIAL: 'MATERIALS',
              WORK: 'LABOR',
            };
            const BUDGET_ITEM_TYPE: Record<string, string> = {
              EQUIPMENT: 'EQUIPMENT',
              MATERIAL: 'MATERIALS',
              WORK: 'WORKS',
            };
            // Group by sectionName so each section becomes an FM section header
            const bySection = new Map<string, typeof specItems>();
            for (const item of specItems) {
              const key = item.sectionName ?? '';
              if (!bySection.has(key)) bySection.set(key, []);
              bySection.get(key)!.push(item);
            }
            let pushed = 0;
            for (const [sectionKey, sectionItems] of bySection) {
              const sectionLabel = sectionKey || (data.name.trim() || 'Спецификация');
              const sectionHeader = await financeApi.createBudgetItem(budget.id, {
                name: sectionLabel,
                category: 'OTHER',
                section: true,
                plannedAmount: 0,
              });
              for (const item of sectionItems) {
                await financeApi.createBudgetItem(budget.id, {
                  name: item.name,
                  category: CATEGORY[item.itemType] ?? 'OTHER',
                  itemType: BUDGET_ITEM_TYPE[item.itemType] ?? 'OTHER',
                  section: false,
                  unit: item.unitOfMeasure,
                  quantity: item.quantity,
                  sectionId: sectionHeader.id,
                  plannedAmount: 0,
                });
                pushed++;
              }
            }
            toast.success(t('specifications.autoFmSuccess', { count: String(pushed) }));

            // 4. Auto-create КП linked to the same budget
            if (autoKp) {
              try {
                const cpName = `КП — ${data.name.trim()}`;
                await financeApi.createCommercialProposal({
                  budgetId: budget.id,
                  name: cpName,
                  specificationId: spec.id,
                });
                toast.success(t('specifications.autoKpSuccess', { name: cpName }));
              } catch {
                // Non-fatal
                console.warn('[SpecForm] Auto-КП creation failed');
              }
            }
          }
        } catch {
          // Non-fatal — spec is already created
          console.warn('[SpecForm] Auto-FM push failed');
        }
      }

      return spec;
    },
    onSuccess: (spec) => {
      queryClient.invalidateQueries({ queryKey: ['specifications'] });
      toast.success(t('forms.specification.createSuccess'));
      navigate(`/specifications/${spec.id}`);
    },
    onError: () => toast.error(t('forms.specification.createError')),
  });

  const updateMutation = useMutation({
    mutationFn: (data: SpecificationFormData) =>
      specificationsApi.updateSpecification(id!, {
        title: data.name.trim(),
        status: data.status,
        notes: data.notes,
      } as Parameters<typeof specificationsApi.updateSpecification>[1]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['specifications'] });
      queryClient.invalidateQueries({ queryKey: ['SPECIFICATION', id] });
      toast.success(t('forms.specification.updateSuccess'));
      navigate(`/specifications/${id}`);
    },
    onError: () => toast.error(t('forms.specification.updateError')),
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (data: SpecificationFormData) => {
    if (isEdit) updateMutation.mutate(data);
    else createMutation.mutate(data);
  };

  const validItemCount = lineItems.filter((li) => li.name.trim()).length;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={isEdit ? t('forms.specification.editTitle') : t('forms.specification.createTitle')}
        subtitle={isEdit ? existingSpec?.name : t('forms.specification.createSubtitle')}
        backTo={isEdit ? `/specifications/${id}` : '/specifications'}
        breadcrumbs={[
          { label: t('forms.common.home'), href: '/' },
          { label: t('forms.specification.breadcrumbSpecifications'), href: '/specifications' },
          { label: isEdit ? t('forms.common.editing') : t('forms.common.creating') },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-6xl space-y-6">

        {/* ── Basic info ── */}
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.common.basicInfo')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('forms.specification.labelProject')} error={errors.projectId?.message} required>
              <Select
                options={projectOptions}
                placeholder={t('forms.specification.placeholderProject')}
                hasError={!!errors.projectId}
                {...register('projectId')}
              />
            </FormField>
            <FormField label={t('forms.specification.labelName')} error={errors.name?.message} required className="sm:col-span-2">
              <Input placeholder={t('forms.specification.placeholderName')} hasError={!!errors.name} {...register('name')} />
            </FormField>
            <FormField label={t('forms.specification.labelStatus')} error={errors.status?.message} required>
              <Select options={statusOptions} hasError={!!errors.status} {...register('status')} />
            </FormField>
            <FormField label={t('forms.specification.labelNotes')} className="sm:col-span-2">
              <Textarea placeholder={t('forms.specification.placeholderNotes')} rows={2} {...register('notes')} />
            </FormField>
          </div>
        </section>

        {/* ── Spec items (only on create) ── */}
        {!isEdit && (
          <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{t('forms.specification.sectionLineItems')}</h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" />
                  {t('specifications.itemsHintNoPrices')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} />
                <input
                  ref={pdfInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handlePdfFile(f);
                    e.target.value = '';
                  }}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  iconLeft={isPdfParsing ? undefined : <FileUp size={14} />}
                  loading={isPdfParsing}
                  onClick={() => pdfInputRef.current?.click()}
                >
                  {isPdfParsing ? 'Читаю PDF...' : t('specifications.importPdfBtn')}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  iconLeft={<FileSpreadsheet size={14} />}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {t('specifications.importXlsx')}
                </Button>
                <Button type="button" variant="secondary" size="sm" iconLeft={<Plus size={14} />} onClick={addLineItem}>
                  {t('forms.specification.addLineItem')}
                </Button>
              </div>
            </div>

            {/* Drag-drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`mb-4 border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                isDragOver
                  ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-neutral-300 dark:border-neutral-600 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
              }`}
            >
              <Upload className="w-5 h-5 mx-auto mb-1 text-neutral-400" />
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">{t('specifications.importXlsxDrop')}</p>
              <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">XLSX, XLS или PDF — перетащите сюда</p>
            </div>

            {importError && (
              <div className="mb-4 flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {importError}
              </div>
            )}

            {/* Auto-FM + Auto-КП toggles */}
            {watchProjectId && (
              <div className="flex flex-col gap-2 mb-4">
                <label className="flex items-center gap-2 cursor-pointer w-fit">
                  <input
                    type="checkbox"
                    checked={autoFm}
                    onChange={(e) => { setAutoFm(e.target.checked); if (!e.target.checked) setAutoKp(false); }}
                    className="w-4 h-4 accent-blue-600"
                  />
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">{t('specifications.autoFmLabel')}</span>
                </label>
                {autoFm && (
                  <label className="flex items-center gap-2 cursor-pointer w-fit ml-6">
                    <input
                      type="checkbox"
                      checked={autoKp}
                      onChange={(e) => setAutoKp(e.target.checked)}
                      className="w-4 h-4 accent-blue-600"
                    />
                    <span className="text-sm text-neutral-700 dark:text-neutral-300">{t('specifications.autoKpLabel')}</span>
                  </label>
                )}
              </div>
            )}

            {/* Column headers */}
            <div className="hidden lg:grid grid-cols-[2.5rem_2fr_1.2fr_0.9fr_1.2fr_0.5fr_0.6fr_0.6fr_1fr_0.8fr_auto] gap-2 px-2 mb-1 text-xs font-medium text-neutral-500 dark:text-neutral-400">
              <div>{t('specifications.colPosition')}</div>
              <div>{t('specifications.itemColName')}</div>
              <div>{t('specifications.itemColBrand')}</div>
              <div>{t('specifications.itemColProductCode')}</div>
              <div>{t('specifications.itemColManufacturer')}</div>
              <div>{t('specifications.itemColQty')}</div>
              <div>{t('specifications.itemColUnit')}</div>
              <div>{t('specifications.itemColWeight')}</div>
              <div>{t('specifications.colNotes')}</div>
              <div>{t('specifications.colItemType')}</div>
              <div />
            </div>

            {/* Rows — with section dividers when items come from PDF */}
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {(() => {
                const rows: React.ReactNode[] = [];
                let lastSection: string | null = undefined as unknown as null;
                lineItems.forEach((item, idx) => {
                  const section = item.sectionName || null;
                  // Insert section header when section changes
                  if (section !== lastSection) {
                    lastSection = section;
                    if (section) {
                      rows.push(
                        <div key={`section-${idx}`} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
                          <Tag size={13} className="text-primary-600 dark:text-primary-400 flex-shrink-0" />
                          <span className="text-xs font-semibold text-primary-800 dark:text-primary-300 leading-tight">{section}</span>
                        </div>
                      );
                    }
                  }
                  rows.push(
                    <div
                      key={idx}
                      className="grid grid-cols-1 lg:grid-cols-[2.5rem_2fr_1.2fr_0.9fr_1.2fr_0.5fr_0.6fr_0.6fr_1fr_0.8fr_auto] gap-2 items-center p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700"
                    >
                      {/* Position (read-only badge from PDF) */}
                      <div className="flex items-center justify-center">
                        <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-200 dark:bg-neutral-700 rounded px-1.5 py-0.5 min-w-[1.5rem] text-center">
                          {item.position || String(idx + 1)}
                        </span>
                      </div>
                      {/* Name */}
                      <div className="lg:col-span-1">
                        <label className="lg:hidden text-xs text-neutral-500 dark:text-neutral-400 mb-0.5 block">{t('specifications.itemColName')}</label>
                        <Input
                          placeholder={t('forms.specification.placeholderItemName')}
                          value={item.name}
                          onChange={(e) => updateLineItem(idx, 'name', e.target.value)}
                        />
                      </div>
                      {/* Brand */}
                      <div>
                        <label className="lg:hidden text-xs text-neutral-500 dark:text-neutral-400 mb-0.5 block">{t('specifications.itemColBrand')}</label>
                        <Input
                          placeholder={t('specifications.placeholderBrand')}
                          value={item.brand}
                          onChange={(e) => updateLineItem(idx, 'brand', e.target.value)}
                        />
                      </div>
                      {/* Code */}
                      <div>
                        <label className="lg:hidden text-xs text-neutral-500 dark:text-neutral-400 mb-0.5 block">{t('specifications.itemColProductCode')}</label>
                        <Input
                          placeholder={t('forms.specification.placeholderProductCode')}
                          value={item.productCode}
                          onChange={(e) => updateLineItem(idx, 'productCode', e.target.value)}
                        />
                      </div>
                      {/* Manufacturer */}
                      <div>
                        <label className="lg:hidden text-xs text-neutral-500 dark:text-neutral-400 mb-0.5 block">{t('specifications.itemColManufacturer')}</label>
                        <Input
                          placeholder={t('specifications.placeholderManufacturer')}
                          value={item.manufacturer}
                          onChange={(e) => updateLineItem(idx, 'manufacturer', e.target.value)}
                        />
                      </div>
                      {/* Qty */}
                      <div>
                        <label className="lg:hidden text-xs text-neutral-500 dark:text-neutral-400 mb-0.5 block">{t('specifications.itemColQty')}</label>
                        <Input
                          inputMode="numeric"
                          placeholder="1"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(idx, 'quantity', e.target.value)}
                        />
                      </div>
                      {/* Unit */}
                      <div>
                        <label className="lg:hidden text-xs text-neutral-500 dark:text-neutral-400 mb-0.5 block">{t('specifications.itemColUnit')}</label>
                        <Input
                          placeholder="шт"
                          value={item.unitOfMeasure}
                          onChange={(e) => updateLineItem(idx, 'unitOfMeasure', e.target.value)}
                        />
                      </div>
                      {/* Weight */}
                      <div>
                        <label className="lg:hidden text-xs text-neutral-500 dark:text-neutral-400 mb-0.5 block">{t('specifications.itemColWeight')}</label>
                        <Input
                          inputMode="numeric"
                          placeholder="—"
                          value={item.weight}
                          onChange={(e) => updateLineItem(idx, 'weight', e.target.value)}
                        />
                      </div>
                      {/* Notes */}
                      <div>
                        <label className="lg:hidden text-xs text-neutral-500 dark:text-neutral-400 mb-0.5 block">{t('specifications.colNotes')}</label>
                        <Input
                          placeholder="—"
                          value={item.notes}
                          onChange={(e) => updateLineItem(idx, 'notes', e.target.value)}
                        />
                      </div>
                      {/* Item type */}
                      <div>
                        <label className="lg:hidden text-xs text-neutral-500 dark:text-neutral-400 mb-0.5 block">{t('specifications.colItemType')}</label>
                        <select
                          value={item.itemType}
                          onChange={(e) => updateLineItem(idx, 'itemType', e.target.value)}
                          className="w-full h-9 px-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
                        >
                          {ITEM_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </div>
                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => removeLineItem(idx)}
                        disabled={lineItems.length === 1}
                        className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-30"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  );
                });
                return rows;
              })()}
            </div>

            {validItemCount > 0 && (
              <p className="mt-3 text-xs text-neutral-400 dark:text-neutral-500">
                {t('specifications.itemsCount', { count: String(validItemCount) })}
                {autoFm && watchProjectId && (
                  <span className="ml-2 text-blue-500 dark:text-blue-400">
                    · {t('specifications.autoFmNote')}
                    {autoKp && ` · ${t('specifications.autoKpNote')}`}
                  </span>
                )}
              </p>
            )}
          </section>
        )}

        {/* ── Submit ── */}
        <div className="flex items-center gap-3 pb-8">
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? t('forms.common.saveChanges') : t('forms.specification.createButton')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(isEdit ? `/specifications/${id}` : '/specifications')}
          >
            {t('common.cancel')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SpecificationFormPage;
