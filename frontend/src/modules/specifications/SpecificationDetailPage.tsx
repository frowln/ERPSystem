import React, { useRef, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Package, Wrench, Cpu, Layers, FilePlus2, ArrowUpRight, FileUp, Tag, Pencil, Trash2, Plus, GitBranch, Upload, Calculator, Clock } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { MetricCard } from '@/design-system/components/MetricCard';
import { DataTable } from '@/design-system/components/DataTable';
import { Button } from '@/design-system/components/Button';
import { Modal } from '@/design-system/components/Modal';
import { Input, Select } from '@/design-system/components/FormField';
import {
  StatusBadge,
  specificationStatusColorMap,
  specificationStatusLabels,
  specItemTypeColorMap,
  specItemTypeLabels,
} from '@/design-system/components/StatusBadge';
import { specificationsApi, type ParsedSpecItem, type CreateSpecItemRequest } from '@/api/specifications';
import { financeApi } from '@/api/finance';
import { procurementApi } from '@/api/procurement';
import { t } from '@/i18n';
import toast from 'react-hot-toast';
import type { Budget, CommercialProposal, Specification, SpecItem, SpecItemType } from '@/types';

const ITEM_TYPE_TO_CATEGORY: Record<string, string> = {
  EQUIPMENT: 'EQUIPMENT',
  MATERIAL: 'MATERIALS',
  WORK: 'LABOR',
};

// SpecItemType → BudgetItemType enum mapping (backend uses WORKS/MATERIALS, not WORK/MATERIAL)
const ITEM_TYPE_TO_BUDGET_TYPE: Record<string, string> = {
  EQUIPMENT: 'EQUIPMENT',
  MATERIAL: 'MATERIALS',
  WORK: 'WORKS',
};

const SpecificationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [pushToFmOpen, setPushToFmOpen] = useState(false);
  const [selectedBudgetId, setSelectedBudgetId] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Add item state
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [addItemSection, setAddItemSection] = useState('');
  const [addItemForm, setAddItemForm] = useState<Partial<CreateSpecItemRequest>>({ itemType: 'EQUIPMENT', quantity: 1, unitOfMeasure: 'шт' });

  // ─── Import state ─────────────────────────────────────────────────────────
  type ConflictAction = 'replace' | 'add_new' | 'sum_qty' | 'skip';
  interface ImportConflict {
    existing: SpecItem;
    incoming: ParsedSpecItem;
    action: ConflictAction;
    changedFields: string[];
  }
  interface ImportPlan {
    newItems: ParsedSpecItem[];
    conflicts: ImportConflict[];
    unchanged: ParsedSpecItem[];
  }

  const [importOpen, setImportOpen] = useState(false);
  const [parsedItems, setParsedItems] = useState<ParsedSpecItem[] | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [importPlan, setImportPlan] = useState<ImportPlan | null>(null);
  const [conflictActions, setConflictActions] = useState<Record<string, ConflictAction>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: spec } = useQuery({
    queryKey: ['SPECIFICATION', id],
    queryFn: () => specificationsApi.getSpecification(id!),
    enabled: !!id,
  });

  const { data: items } = useQuery({
    queryKey: ['spec-items', id],
    queryFn: () => specificationsApi.getSpecItems(id!),
    enabled: !!id,
  });

  const { data: projectBudgets } = useQuery({
    queryKey: ['budgets', 'by-project', spec?.projectId],
    queryFn: () => financeApi.getBudgets({ projectId: spec!.projectId, page: 0, size: 20 }),
    enabled: !!spec?.projectId,
  });

  const { data: projectProposals } = useQuery({
    queryKey: ['commercial-proposals', 'by-project', spec?.projectId],
    queryFn: () => financeApi.getCommercialProposals({ projectId: spec!.projectId, page: 0, size: 30 }),
    enabled: !!spec?.projectId,
  });

  const s = spec;
  const specItems = items ?? [];
  const budgets = (projectBudgets?.content ?? []) as Budget[];

  const summary = useMemo(() => {
    const materials = specItems.filter((i) => i.itemType === 'MATERIAL');
    const equipment = specItems.filter((i) => i.itemType === 'EQUIPMENT');
    const works = specItems.filter((i) => i.itemType === 'WORK');
    return {
      total: specItems.length,
      materialCount: materials.length,
      equipmentCount: equipment.length,
      workCount: works.length,
    };
  }, [specItems]);

  const relatedBudget = useMemo(() => budgets[0], [budgets]);
  const relatedProposal = useMemo(() => {
    const proposals = (projectProposals?.content ?? []) as CommercialProposal[];
    return proposals.find((p) => p.specificationId === id) ?? proposals[0];
  }, [projectProposals, id]);

  // Push spec items to FM budget
  const pushToFmMutation = useMutation({
    mutationFn: async (budgetId: string) => {
      const nonEmpty = specItems.filter((i) => i.name?.trim() && !i.budgetItemId);
      if (nonEmpty.length === 0) return 0;

      // Group items by sectionName — each unique section becomes its own FM section header
      const bySection = new Map<string, SpecItem[]>();
      for (const item of nonEmpty) {
        const key = item.sectionName ?? '';
        if (!bySection.has(key)) bySection.set(key, []);
        bySection.get(key)!.push(item);
      }

      // Batch size: flush in chunks to avoid overwhelming the server for large specs (1000+ items)
      const CHUNK_SIZE = 20;
      const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

      let pushed = 0;
      for (const [sectionKey, sectionItems] of bySection) {
        // Use the section name from PDF, or fall back to spec name if no sections
        const sectionLabel = sectionKey || (spec?.name ?? 'Спецификация');
        const sectionHeader = await financeApi.createBudgetItem(budgetId, {
          name: sectionLabel,
          category: 'OTHER',
          section: true,
          plannedAmount: 0,
        });

        for (let i = 0; i < sectionItems.length; i++) {
          const item = sectionItems[i];
          const budgetItem = await financeApi.createBudgetItem(budgetId, {
            name: item.name,
            category: ITEM_TYPE_TO_CATEGORY[item.itemType] ?? 'OTHER',
            itemType: ITEM_TYPE_TO_BUDGET_TYPE[item.itemType] ?? 'OTHER',
            section: false,
            unit: item.unitOfMeasure,
            quantity: item.quantity,
            parentId: sectionHeader.id,
            plannedAmount: 0,
          });
          // Back-link: записываем budgetItemId обратно в позицию спецификации
          try {
            await specificationsApi.updateSpecItem(item.id, { budgetItemId: budgetItem.id }, { silent: true });
          } catch {
            // Non-fatal — FM item created, link loss is minor
          }
          pushed++;
          // Brief pause every chunk to avoid rate limits on very large specs
          if ((i + 1) % CHUNK_SIZE === 0) await delay(200);
        }
      }
      return pushed;
    },
    onSuccess: (pushed) => {
      queryClient.invalidateQueries({ queryKey: ['budget-items', selectedBudgetId] });
      queryClient.invalidateQueries({ queryKey: ['spec-items', id] });
      toast.success(t('specifications.pushToFmSuccess'));
      setPushToFmOpen(false);
      if (selectedBudgetId) {
        navigate(`/budgets/${selectedBudgetId}/fm`);
      }
    },
    onError: () => toast.error(t('specifications.pushToFmError')),
  });

  const handlePushConfirm = () => {
    if (!selectedBudgetId) return;
    pushToFmMutation.mutate(selectedBudgetId);
  };

  const deleteMutation = useMutation({
    mutationFn: () => specificationsApi.deleteSpecification(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['specifications'] });
      toast.success(t('specifications.deleteSuccess'));
      navigate('/specifications');
    },
    onError: () => toast.error(t('specifications.deleteError')),
  });

  const addItemMutation = useMutation({
    mutationFn: (req: CreateSpecItemRequest) => specificationsApi.createSpecItem(id!, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spec-items', id] });
      toast.success(t('specifications.addItemSuccess'));
      setAddItemOpen(false);
      setAddItemForm({ itemType: 'EQUIPMENT', quantity: 1, unitOfMeasure: 'шт' });
    },
    onError: () => toast.error(t('specifications.addItemError')),
  });

  const deleteItemMutation = useMutation({
    mutationFn: (itemId: string) => specificationsApi.deleteSpecItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spec-items', id] });
      toast.success(t('specifications.deleteItemSuccess'));
    },
    onError: () => toast.error(t('specifications.deleteItemError')),
  });

  const createVersionMutation = useMutation({
    mutationFn: () => specificationsApi.createVersion(id!),
    onSuccess: (newSpec) => {
      queryClient.invalidateQueries({ queryKey: ['specifications'] });
      toast.success(`${t('specifications.newVersion')}: v${newSpec.version ?? ''}`);
      navigate(`/specifications/${newSpec.id}`);
    },
    onError: () => toast.error(t('specifications.deleteError')),
  });

  const createPrMutation = useMutation({
    mutationFn: (selectedIds: string[]) => procurementApi.createFromSpecItems(spec!.projectId, id!, selectedIds),
    onSuccess: (res) => {
      toast.success('Заявка на закупку создана');
      navigate(`/procurement/requests/${res.id}`);
    },
    onError: () => toast.error('Ошибка создания заявки'),
  });

  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);

  const handleAddItemToSection = (sectionName: string) => {
    setAddItemSection(sectionName);
    setAddItemForm({ itemType: 'EQUIPMENT', quantity: 1, unitOfMeasure: 'шт', sectionName: sectionName || undefined });
    setAddItemOpen(true);
  };

  const handleAddItemSubmit = () => {
    if (!addItemForm.name?.trim()) return;
    addItemMutation.mutate({
      name: addItemForm.name!,
      itemType: (addItemForm.itemType as SpecItemType) ?? 'EQUIPMENT',
      brand: addItemForm.brand || undefined,
      productCode: addItemForm.productCode || undefined,
      manufacturer: addItemForm.manufacturer || undefined,
      quantity: addItemForm.quantity ?? 1,
      unitOfMeasure: addItemForm.unitOfMeasure ?? 'шт',
      notes: addItemForm.notes || undefined,
      sectionName: addItemForm.sectionName || undefined,
      sequence: specItems.length + 1,
    } as CreateSpecItemRequest);
  };

  // ─── Import handlers ───────────────────────────────────────────────────────

  const computeImportPlan = (parsed: ParsedSpecItem[], existing: SpecItem[]): ImportPlan => {
    const newItems: ParsedSpecItem[] = [];
    const conflicts: ImportConflict[] = [];
    const unchanged: ParsedSpecItem[] = [];

    for (const incoming of parsed) {
      const match = existing.find(
        (e) => e.name.trim().toLowerCase() === incoming.name.trim().toLowerCase(),
      );
      if (!match) {
        newItems.push(incoming);
      } else {
        const changedFields: string[] = [];
        if (Math.abs((incoming.quantity ?? 1) - match.quantity) > 0.001) changedFields.push('quantity');
        if ((incoming.brand ?? '') !== (match.brand ?? '')) changedFields.push('brand');
        if ((incoming.productCode ?? '') !== (match.productCode ?? '')) changedFields.push('productCode');
        if ((incoming.manufacturer ?? '') !== (match.manufacturer ?? '')) changedFields.push('manufacturer');
        if (incoming.unitOfMeasure !== match.unitOfMeasure) changedFields.push('unitOfMeasure');

        if (changedFields.length === 0) {
          unchanged.push(incoming);
        } else {
          conflicts.push({ existing: match, incoming, action: 'replace', changedFields });
        }
      }
    }
    return { newItems, conflicts, unchanged };
  };

  const handleImportFile = async (file: File) => {
    if (!id) return;
    setIsParsing(true);
    setParsedItems(null);
    setImportPlan(null);
    try {
      let parsed: ParsedSpecItem[];
      if (file.name.match(/\.pdf$/i)) {
        parsed = await specificationsApi.parsePdf(id, file);
      } else {
        // XLSX — use the previewPdf endpoint with a fake parse, or inline parse
        // For XLSX we call previewPdf-like flow: import * as XLSX
        const { read, utils } = await import('xlsx');
        const buffer = await file.arrayBuffer();
        const wb = read(new Uint8Array(buffer), { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = (utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false }) as unknown[][])
          .map((r) => r.map((c) => String(c ?? '').trim()));

        // Find header row
        let hRow = -1, nameCol = -1, brandCol = -1, codeCol = -1, mfgCol = -1;
        let unitCol = -1, qtyCol = -1, weightCol = -1, noteCol = -1;
        for (let r = 0; r < Math.min(rows.length, 25); r++) {
          const row = rows[r].map((c) => c.toLowerCase());
          const ni = row.findIndex((c) => c.includes('наименован') || c === 'name');
          if (ni < 0) continue;
          hRow = r; nameCol = ni;
          brandCol = row.findIndex((c) => c.includes('тип') || c.includes('марк') || c === 'brand');
          codeCol  = row.findIndex((c) => c.includes('код') || c.includes('артикул'));
          mfgCol   = row.findIndex((c) => c.includes('завод') || c.includes('производ'));
          unitCol  = row.findIndex((c) => (c.includes('ед') && c.includes('изм')) || c === 'unit');
          qtyCol   = row.findIndex((c) => c.includes('кол') || c === 'qty');
          weightCol = row.findIndex((c) => c.includes('вес') || c === 'weight');
          noteCol  = row.findIndex((c) => c.includes('примечан') || c.includes('note'));
          break;
        }
        if (hRow < 0) { hRow = 0; nameCol = 1; brandCol = 2; codeCol = 3; mfgCol = 4; unitCol = 5; qtyCol = 6; weightCol = 7; noteCol = 8; }
        const col = (row: string[], idx: number) => (idx >= 0 ? row[idx] ?? '' : '');
        parsed = [];
        for (let r = hRow + 1; r < rows.length; r++) {
          const row = rows[r];
          const rawName = col(row, nameCol);
          if (!rawName || rawName.length < 2) continue;
          const rawQty = parseFloat(col(row, qtyCol).replace(',', '.'));
          parsed.push({
            position: null,
            itemType: 'EQUIPMENT' as const,
            name: rawName,
            brand: col(row, brandCol) || null,
            productCode: col(row, codeCol) || null,
            manufacturer: col(row, mfgCol) || null,
            unitOfMeasure: col(row, unitCol) || 'шт',
            quantity: isNaN(rawQty) || rawQty <= 0 ? 1 : rawQty,
            mass: (() => { const w = parseFloat(col(row, weightCol).replace(',', '.')); return isNaN(w) ? null : w; })(),
            notes: col(row, noteCol) || null,
            sectionName: null,
          });
        }
      }
      if (parsed.length === 0) {
        toast.error(t('specifications.importError'));
        return;
      }
      setParsedItems(parsed);
      const plan = computeImportPlan(parsed, specItems);
      setImportPlan(plan);
      setConflictActions(
        Object.fromEntries(plan.conflicts.map((c) => [c.existing.id, c.action])),
      );
    } catch {
      toast.error(t('specifications.importError'));
    } finally {
      setIsParsing(false);
    }
  };

  const applyImportMutation = useMutation({
    mutationFn: async () => {
      if (!importPlan) return 0;
      let count = 0;

      // 1. Add new items
      for (const item of importPlan.newItems) {
        await specificationsApi.createSpecItem(id!, {
          name: item.name,
          itemType: item.itemType as SpecItemType,
          brand: item.brand ?? undefined,
          productCode: item.productCode ?? undefined,
          manufacturer: item.manufacturer ?? undefined,
          quantity: item.quantity,
          unitOfMeasure: item.unitOfMeasure,
          notes: item.notes ?? undefined,
          sectionName: item.sectionName ?? undefined,
          position: item.position ?? undefined,
          sequence: specItems.length + count + 1,
        });
        count++;
      }

      // 2. Handle conflicts
      for (const conflict of importPlan.conflicts) {
        const action = conflictActions[conflict.existing.id] ?? 'skip';
        const { incoming, existing } = conflict;

        if (action === 'replace') {
          await specificationsApi.updateSpecItem(existing.id, {
            brand: incoming.brand ?? undefined,
            productCode: incoming.productCode ?? undefined,
            manufacturer: incoming.manufacturer ?? undefined,
            quantity: incoming.quantity,
            unitOfMeasure: incoming.unitOfMeasure,
            notes: incoming.notes ?? undefined,
          }, { silent: true });
          count++;
        } else if (action === 'add_new') {
          await specificationsApi.createSpecItem(id!, {
            name: incoming.name,
            itemType: incoming.itemType as SpecItemType,
            brand: incoming.brand ?? undefined,
            productCode: incoming.productCode ?? undefined,
            manufacturer: incoming.manufacturer ?? undefined,
            quantity: incoming.quantity,
            unitOfMeasure: incoming.unitOfMeasure,
            notes: incoming.notes ?? undefined,
            sectionName: incoming.sectionName ?? undefined,
            sequence: specItems.length + count + 1,
          });
          count++;
        } else if (action === 'sum_qty') {
          await specificationsApi.updateSpecItem(existing.id, {
            quantity: existing.quantity + incoming.quantity,
          }, { silent: true });
          count++;
        }
        // 'skip' → do nothing
      }

      return count;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['spec-items', id] });
      toast.success(t('specifications.importSuccess').replace('{count}', String(count)));
      setImportOpen(false);
      setParsedItems(null);
      setImportPlan(null);
    },
    onError: () => toast.error(t('specifications.importError')),
  });

  const columns = useMemo<ColumnDef<SpecItem, unknown>[]>(
    () => [
      {
        accessorKey: 'position',
        header: t('specifications.colPosition'),
        size: 60,
        cell: ({ getValue, row }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">
            {getValue<string>() || String(row.original.sequence)}
          </span>
        ),
      },
      {
        accessorKey: 'itemType',
        header: t('specifications.colItemType'),
        size: 110,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={specItemTypeColorMap}
            label={specItemTypeLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'name',
        header: t('specifications.itemColName'),
        size: 280,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100 leading-tight">{row.original.name}</p>
            {row.original.brand && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.brand}</p>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'productCode',
        header: t('specifications.itemColProductCode'),
        size: 110,
        cell: ({ getValue }) => (
          <span className="font-mono text-xs text-neutral-600 dark:text-neutral-400">{getValue<string>() || '—'}</span>
        ),
      },
      {
        accessorKey: 'manufacturer',
        header: t('specifications.itemColManufacturer'),
        size: 160,
        cell: ({ getValue }) => (
          <span className="text-sm text-neutral-700 dark:text-neutral-300">{getValue<string>() || '—'}</span>
        ),
      },
      {
        accessorKey: 'quantity',
        header: t('specifications.itemColQty'),
        size: 80,
        cell: ({ row }) => (
          <span className="tabular-nums font-medium text-neutral-800 dark:text-neutral-200">
            {row.original.quantity != null ? new Intl.NumberFormat('ru-RU').format(row.original.quantity) : '—'}
          </span>
        ),
      },
      {
        accessorKey: 'unitOfMeasure',
        header: t('specifications.itemColUnit'),
        size: 70,
        cell: ({ getValue }) => (
          <span className="text-neutral-600 dark:text-neutral-400">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'weight',
        header: t('specifications.itemColWeight'),
        size: 80,
        cell: ({ getValue }) => {
          const v = getValue<number | undefined>();
          return <span className="tabular-nums text-neutral-600 dark:text-neutral-400">{v != null ? v : '—'}</span>;
        },
      },
      {
        accessorKey: 'procurementStatus',
        header: t('specifications.detailColProcurementStatus'),
        size: 120,
        cell: ({ getValue }) => {
          const val = getValue<string>();
          const statusLabels: Record<string, string> = {
            'not_started': t('specifications.procurementStatusNotStarted'),
            'in_progress': t('specifications.procurementStatusInProgress'),
            'completed': t('specifications.procurementStatusCompleted'),
          };
          const translatedVal = statusLabels[val] || val;
          const cls: Record<string, string> = {
            'Не начата':   'text-neutral-500 bg-neutral-100 dark:bg-neutral-800',
            'В процессе':  'text-warning-600 bg-warning-50 dark:bg-warning-900/20',
            'Завершена':   'text-success-600 bg-success-50 dark:bg-success-900/20',
          };
          return (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cls[translatedVal] ?? 'text-neutral-400'}`}>
              {translatedVal || '—'}
            </span>
          );
        },
      },
      {
        accessorKey: 'notes',
        header: t('specifications.itemColNotes'),
        size: 160,
        cell: ({ getValue }) => (
          <span className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">{getValue<string>() || ''}</span>
        ),
      },
      {
        id: 'longLead',
        header: t('specifications.longLead.column'),
        size: 90,
        cell: ({ row }) => {
          const item = row.original;
          if (!item.longLead) return <span className="text-xs text-neutral-300 dark:text-neutral-600">—</span>;
          return (
            <div className="flex items-center gap-1">
              <Clock size={13} className="text-amber-500" />
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                {item.leadTimeDays ? `${item.leadTimeDays}${t('specifications.longLead.days')}` : t('specifications.longLead.flag')}
              </span>
            </div>
          );
        },
      },
      {
        id: 'fm_linked',
        header: () => (
          <span title="Передано в Финансовую Модель (бюджет объекта)">В ФМ</span>
        ),
        size: 55,
        cell: ({ row }) => (
          row.original.budgetItemId
            ? <span className="text-xs text-green-600 dark:text-green-400 font-semibold" title="Передано в ФМ">✓ ФМ</span>
            : <span className="text-xs text-neutral-300 dark:text-neutral-600">—</span>
        ),
      },
      {
        id: 'actions',
        header: '',
        size: 50,
        cell: ({ row }) => (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setDeleteItemId(row.original.id); }}
            className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
            title={t('common.delete')}
          >
            <Trash2 size={14} />
          </button>
        ),
      },
    ],
    [],
  );

  // Group items by sectionName for visual section dividers
  const sectionsData = useMemo(() => {
    const hasSections = specItems.some((i) => i.sectionName);
    if (!hasSections) return null;
    const map = new Map<string, SpecItem[]>();
    for (const item of specItems) {
      const key = item.sectionName ?? '';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return map;
  }, [specItems]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={s?.title ?? s?.name ?? ''}
        subtitle={[
          s?.name,
          s?.projectName,
          s?.version != null ? `v${s.version}` : null,
        ].filter(Boolean).join(' · ')}
        backTo="/specifications"
        breadcrumbs={[
          { label: t('specifications.breadcrumbHome'), href: '/' },
          { label: t('specifications.breadcrumbSpecifications'), href: '/specifications' },
          { label: s?.title ?? s?.name ?? '' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<Upload size={14} />}
              onClick={() => { setImportOpen(true); setParsedItems(null); setImportPlan(null); }}
            >
              {t('specifications.importBtn')}
            </Button>
            {specItems.length > 0 && (
              <Button
                variant="secondary"
                size="sm"
                iconLeft={<ArrowUpRight size={14} />}
                onClick={() => {
                  setSelectedBudgetId(budgets[0]?.id ?? '');
                  setPushToFmOpen(true);
                }}
              >
                {t('specifications.pushToFmBtn')}
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<Calculator size={14} />}
              onClick={() => navigate(`/estimates/new?specificationId=${id}&projectId=${s?.projectId ?? ''}`)}
            >
              {t('specifications.createEstimate')}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<Plus size={14} />}
              onClick={() => handleAddItemToSection('')}
            >
              {t('specifications.addItemBtn')}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<GitBranch size={14} />}
              loading={createVersionMutation.isPending}
              onClick={() => createVersionMutation.mutate()}
              title={t('specifications.newVersionHint')}
            >
              {t('specifications.newVersion')}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<Pencil size={14} />}
              onClick={() => navigate(`/specifications/${id}/edit`)}
            >
              {t('common.edit')}
            </Button>
            <Button
              variant="danger"
              size="sm"
              iconLeft={<Trash2 size={14} />}
              onClick={() => setDeleteOpen(true)}
            >
              {t('common.delete')}
            </Button>
            <StatusBadge
              status={s?.status ?? ''}
              colorMap={specificationStatusColorMap}
              label={specificationStatusLabels[s?.status ?? ''] ?? s?.status ?? ''}
              size="md"
            />
          </div>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<Layers size={18} />}
          label={t('specifications.detailTotalItems')}
          value={String(summary.total)}
        />
        <MetricCard
          icon={<Package size={18} />}
          label={t('specifications.detailMaterials')}
          value={String(summary.materialCount)}
        />
        <MetricCard
          icon={<Wrench size={18} />}
          label={t('specifications.detailWorks')}
          value={String(summary.workCount)}
        />
        <MetricCard
          icon={<Cpu size={18} />}
          label={t('specifications.detailEquipment')}
          value={String(summary.equipmentCount)}
        />
      </div>

      {/* Flow navigation */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4 mb-6">
        <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
          {t('specifications.flowTitle')}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => navigate(`/specifications/${id}`)}>
            {t('specifications.flowSpec')}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => navigate(`/specifications/${id}/competitive-list/new`)}>
            {t('specifications.flowCl')}
          </Button>
          {relatedProposal && (
            <Button variant="secondary" size="sm" onClick={() => navigate(`/commercial-proposals/${relatedProposal.id}`)}>
              {t('specifications.flowCp')}
            </Button>
          )}
          {relatedBudget && (
            <Button variant="secondary" size="sm" onClick={() => navigate(`/budgets/${relatedBudget.id}/fm`)}>
              {t('specifications.flowFm')}
            </Button>
          )}
        </div>
      </div>

      {/* Items table — grouped by section when PDF sections exist */}
      {sectionsData ? (
        <div className="space-y-5">
          {Array.from(sectionsData.entries()).map(([sectionKey, sectionItems]) => (
            <div key={sectionKey || '__no_section'}>
              {sectionKey && (
                <div className="flex items-center gap-3 px-4 py-2.5 mb-2 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
                  <Tag size={14} className="text-primary-600 dark:text-primary-400 flex-shrink-0" />
                  <span className="text-sm font-semibold text-primary-800 dark:text-primary-300 leading-tight">
                    {sectionKey}
                  </span>
                  <span className="ml-auto text-xs text-primary-600 dark:text-primary-400 bg-primary-100 dark:bg-primary-900/40 rounded-full px-2 py-0.5">
                    {sectionItems.length} поз.
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAddItemToSection(sectionKey)}
                    className="flex items-center gap-1.5 text-xs text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-200 transition-colors ml-2 font-medium"
                  >
                    {t('specifications.addItemToSection')}
                  </button>
                </div>
              )}
              <DataTable<SpecItem>
                data={sectionItems}
                columns={columns}
                enableRowSelection
                bulkActions={[
                  {
                    label: 'В закупку (создать заявку)',
                    icon: <Package size={14} />,
                    onClick: (rows) => createPrMutation.mutate(rows.map((r) => r.id)),
                  },
                ]}
                pageSize={sectionItems.length + 1}
                emptyTitle={t('specifications.detailEmptyTitle')}
                emptyDescription={t('specifications.detailEmptyDescription')}
              />
            </div>
          ))}
        </div>
      ) : (
        <DataTable<SpecItem>
          data={specItems}
          columns={columns}
          enableRowSelection
          bulkActions={[
            {
              label: 'В закупку (создать заявку)',
              icon: <Package size={14} />,
              onClick: (rows) => createPrMutation.mutate(rows.map((r) => r.id)),
            },
          ]}
          enableColumnVisibility
          enableDensityToggle
          enableExport
          pageSize={20}
          emptyTitle={t('specifications.detailEmptyTitle')}
          emptyDescription={t('specifications.detailEmptyDescription')}
        />
      )}

      {/* Smart Import modal */}
      <Modal
        open={importOpen}
        onClose={() => { setImportOpen(false); setParsedItems(null); setImportPlan(null); }}
        title={t('specifications.importTitle')}
        size="xl"
        footer={
          importPlan ? (
            <>
              <Button variant="secondary" size="sm" onClick={() => { setParsedItems(null); setImportPlan(null); }}>
                {t('common.back')}
              </Button>
              <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mx-2">
                {importPlan.newItems.length > 0 && <span className="text-green-600 dark:text-green-400 font-medium">{t('specifications.importSummaryNew').replace('{count}', String(importPlan.newItems.length))}</span>}
                {importPlan.conflicts.filter(c => (conflictActions[c.existing.id] ?? 'replace') === 'replace').length > 0 && <span className="text-orange-600">· {t('specifications.importSummaryReplace').replace('{count}', String(importPlan.conflicts.filter(c => (conflictActions[c.existing.id] ?? 'replace') === 'replace').length))}</span>}
                {importPlan.conflicts.filter(c => conflictActions[c.existing.id] === 'add_new').length > 0 && <span className="text-blue-600">· {t('specifications.importSummaryAdd').replace('{count}', String(importPlan.conflicts.filter(c => conflictActions[c.existing.id] === 'add_new').length))}</span>}
                {importPlan.conflicts.filter(c => conflictActions[c.existing.id] === 'sum_qty').length > 0 && <span className="text-purple-600">· {t('specifications.importSummarySum').replace('{count}', String(importPlan.conflicts.filter(c => conflictActions[c.existing.id] === 'sum_qty').length))}</span>}
              </div>
              <Button
                size="sm"
                iconLeft={<FileUp size={14} />}
                loading={applyImportMutation.isPending}
                onClick={() => applyImportMutation.mutate()}
              >
                {t('specifications.importConfirmBtn')}
              </Button>
            </>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => setImportOpen(false)}>
              {t('common.cancel')}
            </Button>
          )
        }
      >
        <div className="space-y-4">
          {/* Step 1: file drop */}
          {!importPlan && (
            <>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">{t('specifications.importDesc')}</p>
              <div
                className="border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-xl p-10 text-center cursor-pointer hover:border-primary-400 dark:hover:border-primary-500 transition-colors"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files[0];
                  if (f) handleImportFile(f);
                }}
              >
                {isParsing ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-neutral-500">{t('specifications.importParsing')}</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 text-neutral-400 dark:text-neutral-500">
                    <Upload size={40} />
                    <p className="text-sm font-medium">{t('specifications.importDrop')}</p>
                    <p className="text-xs text-neutral-400">PDF, XLSX, XLS</p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.xlsx,.xls,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleImportFile(f);
                  e.target.value = '';
                }}
              />
            </>
          )}

          {/* Step 2: review plan */}
          {importPlan && (
            <div className="space-y-4">
              {/* New items */}
              {importPlan.newItems.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                      {t('specifications.importTabNew').replace('{count}', String(importPlan.newItems.length))}
                    </span>
                    <span className="text-xs text-neutral-500">{t('specifications.importNewHint')}</span>
                  </div>
                  <div className="overflow-auto max-h-40 rounded-lg border border-green-200 dark:border-green-800">
                    <table className="w-full text-xs">
                      <tbody className="divide-y divide-green-100 dark:divide-green-900/30">
                        {importPlan.newItems.map((item, i) => (
                          <tr key={i} className="bg-green-50/40 dark:bg-green-900/10">
                            <td className="px-3 py-1.5 text-neutral-800 dark:text-neutral-100 font-medium min-w-[200px]">{item.name}</td>
                            <td className="px-2 py-1.5 text-neutral-500 text-right tabular-nums">{item.quantity} {item.unitOfMeasure}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Conflicts */}
              {importPlan.conflicts.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 px-2 py-0.5 rounded-full">
                      {t('specifications.importTabChanged').replace('{count}', String(importPlan.conflicts.length))}
                    </span>
                    <span className="text-xs text-neutral-500">{t('specifications.importChangedHint')}</span>
                  </div>
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {importPlan.conflicts.map((conflict) => {
                      const action = conflictActions[conflict.existing.id] ?? 'replace';
                      return (
                        <div key={conflict.existing.id} className="rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50/30 dark:bg-orange-900/10 p-3">
                          <p className="text-sm font-medium text-neutral-800 dark:text-neutral-100 mb-2">{conflict.incoming.name}</p>
                          {/* Changes summary */}
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-3 text-xs">
                            {conflict.changedFields.includes('quantity') && (
                              <>
                                <div className="text-neutral-500">{t('specifications.importChangedOld')}: <span className="font-mono text-red-600">{conflict.existing.quantity} {conflict.existing.unitOfMeasure}</span></div>
                                <div className="text-neutral-500">{t('specifications.importChangedNew')}: <span className="font-mono text-green-600">{conflict.incoming.quantity} {conflict.incoming.unitOfMeasure}</span></div>
                              </>
                            )}
                            {conflict.changedFields.includes('brand') && (
                              <>
                                <div className="text-neutral-500">{t('specifications.importChangedOld')}: <span className="text-red-600">{conflict.existing.brand || '—'}</span></div>
                                <div className="text-neutral-500">{t('specifications.importChangedNew')}: <span className="text-green-600">{conflict.incoming.brand || '—'}</span></div>
                              </>
                            )}
                          </div>
                          {/* Action radio */}
                          <div className="flex flex-wrap gap-2">
                            {(['replace', 'add_new', 'sum_qty', 'skip'] as const).map((a) => (
                              <label key={a} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs cursor-pointer border transition-colors ${
                                action === a
                                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium'
                                  : 'border-neutral-300 dark:border-neutral-600 text-neutral-500 hover:border-neutral-400'
                              }`}>
                                <input
                                  type="radio"
                                  className="hidden"
                                  checked={action === a}
                                  onChange={() => setConflictActions((prev) => ({ ...prev, [conflict.existing.id]: a }))}
                                />
                                {a === 'replace' ? t('specifications.importActionReplace')
                                  : a === 'add_new' ? t('specifications.importActionAddNew')
                                  : a === 'sum_qty' ? t('specifications.importActionSumQty')
                                  : t('specifications.importActionSkip')}
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Unchanged */}
              {importPlan.unchanged.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full">
                    {t('specifications.importTabUnchanged').replace('{count}', String(importPlan.unchanged.length))}
                  </span>
                  <span className="text-xs text-neutral-400">{t('specifications.importUnchangedHint')}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* Delete Specification confirmation modal */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title={t('specifications.deleteConfirmTitle')}
        size="sm"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setDeleteOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              size="sm"
              iconLeft={<Trash2 size={14} />}
              loading={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
            >
              {t('common.delete')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {t('specifications.deleteConfirmDesc')}
        </p>
      </Modal>

      {/* Add Item modal */}
      <Modal
        open={addItemOpen}
        onClose={() => { setAddItemOpen(false); setAddItemForm({ itemType: 'EQUIPMENT', quantity: 1, unitOfMeasure: 'шт' }); }}
        title={t('specifications.addItemTitle')}
        size="lg"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setAddItemOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              size="sm"
              iconLeft={<Plus size={14} />}
              loading={addItemMutation.isPending}
              disabled={!addItemForm.name?.trim()}
              onClick={handleAddItemSubmit}
            >
              {t('specifications.addItemBtn')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {addItemSection && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
              <Tag size={13} className="text-primary-600 dark:text-primary-400 flex-shrink-0" />
              <span className="text-sm font-semibold text-primary-800 dark:text-primary-300">{addItemSection}</span>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                {t('specifications.addItemLabelName')} <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder={t('forms.specification.placeholderItemName')}
                value={addItemForm.name ?? ''}
                onChange={(e) => setAddItemForm((f) => ({ ...f, name: e.target.value }))}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                {t('specifications.addItemLabelType')}
              </label>
              <Select
                options={[
                  { value: 'EQUIPMENT', label: t('specifications.itemTypeEquipment') },
                  { value: 'MATERIAL', label: t('specifications.itemTypeMaterial') },
                  { value: 'WORK', label: t('specifications.itemTypeWork') },
                ]}
                value={addItemForm.itemType ?? 'EQUIPMENT'}
                onChange={(e) => setAddItemForm((f) => ({ ...f, itemType: e.target.value as SpecItemType }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                {t('specifications.addItemLabelBrand')}
              </label>
              <Input
                placeholder="—"
                value={addItemForm.brand ?? ''}
                onChange={(e) => setAddItemForm((f) => ({ ...f, brand: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                {t('specifications.addItemLabelCode')}
              </label>
              <Input
                placeholder="—"
                value={addItemForm.productCode ?? ''}
                onChange={(e) => setAddItemForm((f) => ({ ...f, productCode: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                {t('specifications.addItemLabelManufacturer')}
              </label>
              <Input
                placeholder="—"
                value={addItemForm.manufacturer ?? ''}
                onChange={(e) => setAddItemForm((f) => ({ ...f, manufacturer: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                {t('specifications.addItemLabelQty')} <span className="text-red-500">*</span>
              </label>
              <Input
                inputMode="numeric"
                placeholder="1"
                value={String(addItemForm.quantity ?? 1)}
                onChange={(e) => setAddItemForm((f) => ({ ...f, quantity: parseFloat(e.target.value) || 1 }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                {t('specifications.addItemLabelUnit')}
              </label>
              <Input
                placeholder="шт"
                value={addItemForm.unitOfMeasure ?? 'шт'}
                onChange={(e) => setAddItemForm((f) => ({ ...f, unitOfMeasure: e.target.value }))}
              />
            </div>
            {!addItemSection && (
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  {t('specifications.addItemLabelSection')}
                </label>
                <Input
                  placeholder="—"
                  value={addItemForm.sectionName ?? ''}
                  onChange={(e) => setAddItemForm((f) => ({ ...f, sectionName: e.target.value }))}
                />
              </div>
            )}
            <div className={!addItemSection ? '' : 'sm:col-span-2'}>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                {t('specifications.addItemLabelNotes')}
              </label>
              <Input
                placeholder="—"
                value={addItemForm.notes ?? ''}
                onChange={(e) => setAddItemForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Item confirmation modal */}
      <Modal
        open={!!deleteItemId}
        onClose={() => setDeleteItemId(null)}
        title={t('specifications.deleteItemConfirmTitle')}
        size="sm"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setDeleteItemId(null)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              size="sm"
              iconLeft={<Trash2 size={14} />}
              loading={deleteItemMutation.isPending}
              onClick={() => {
                if (deleteItemId) {
                  deleteItemMutation.mutate(deleteItemId);
                  setDeleteItemId(null);
                }
              }}
            >
              {t('common.delete')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {t('specifications.deleteItemConfirmDesc')}
        </p>
      </Modal>

      {/* Push to FM modal */}
      <Modal
        open={pushToFmOpen}
        onClose={() => setPushToFmOpen(false)}
        title={t('specifications.pushToFmTitle')}
        size="sm"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setPushToFmOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              size="sm"
              iconLeft={<ArrowUpRight size={14} />}
              loading={pushToFmMutation.isPending}
              disabled={!selectedBudgetId}
              onClick={handlePushConfirm}
            >
              {t('specifications.pushToFmConfirm')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {t('specifications.pushToFmDesc', { count: String(specItems.filter((i) => !i.budgetItemId).length) })}
          </p>

          {budgets.length === 0 ? (
            <div className="text-sm text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3">
              {t('specifications.pushToFmNoBudgets')}
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                {t('specifications.pushToFmSelectBudget')}
              </label>
              <select
                value={selectedBudgetId}
                onChange={(e) => setSelectedBudgetId(e.target.value)}
                className="w-full h-9 px-3 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
              >
                <option value="">—</option>
                {budgets.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default SpecificationDetailPage;
