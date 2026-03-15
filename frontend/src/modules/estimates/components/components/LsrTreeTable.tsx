import React, { useState, useCallback, useMemo } from 'react';
import { ChevronRight, ChevronDown, FolderTree } from 'lucide-react';
import { Button } from '@/design-system/components/Button';
import { EditableCell } from '@/components/ui/EditableCell';
import { cn } from '@/lib/cn';
import { formatMoney, formatNumber } from '@/lib/format';
import { t } from '@/i18n';
import type { LocalEstimateLine, LsrLineType, LsrResourceType } from '@/types';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface TreeNode {
  line: LocalEstimateLine;
  children: TreeNode[];
}

interface LsrTreeTableProps {
  lines: LocalEstimateLine[];
  onUpdateLine?: (lineId: string, field: string, value: string | number) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// ГОСТ 12-column grid template (matches Методика 2020 РИМ / ГРАНД-Смета)
//
// Physical layout: A-P (16 xlsx columns) → 12 logical columns:
//  1=№ п/п   2=Обоснование   3=Наименование работ и затрат   4=Единица измерения
//  5=Кол(на ед.изм.)   6=Коэффициенты   7=Кол(всего с учётом коэфф.)
//  8=На ед.изм. в базисном ур. цен   9=Индекс   10=На ед.изм. в текущем ур. цен
//  11=Коэффициенты   12=Всего в текущем ур. цен
// ─────────────────────────────────────────────────────────────────────────────

const GRID_COLS = 'grid-cols-[48px_110px_1fr_72px_90px_72px_90px_110px_68px_110px_72px_130px]';
const MIN_W = 'min-w-[1400px]';

// ─────────────────────────────────────────────────────────────────────────────
// Color config
// ─────────────────────────────────────────────────────────────────────────────

const RESOURCE_COLORS: Record<string, { text: string; bg: string }> = {
  OT: { text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  EM: { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  ZT: { text: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  M: { text: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' },
  NR: { text: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20' },
  SP: { text: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-900/20' },
};

const RESOURCE_LABELS: Record<string, string> = {
  OT: 'estimates.normative.resourceOT',
  EM: 'estimates.normative.resourceEM',
  ZT: 'estimates.normative.resourceZT',
  M: 'estimates.normative.resourceM',
  NR: 'estimates.normative.resourceNR',
  SP: 'estimates.normative.resourceSP',
};

const POSITION_BADGE_COLORS: Record<string, string> = {
  GESN: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  FSBC: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  TC: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  GESNr: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  FER: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  TER: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  MANUAL: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300',
};

// ─────────────────────────────────────────────────────────────────────────────
// Build tree from flat lines
// ─────────────────────────────────────────────────────────────────────────────

function buildTree(lines: LocalEstimateLine[]): TreeNode[] {
  const lineById = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  for (const line of lines) {
    lineById.set(line.id, { line, children: [] });
  }

  for (const line of lines) {
    const node = lineById.get(line.id)!;
    if (line.parentLineId) {
      const parent = lineById.get(line.parentLineId);
      if (parent) {
        parent.children.push(node);
        continue;
      }
    }
    roots.push(node);
  }

  const sortNodes = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => a.line.lineNumber - b.line.lineNumber);
    nodes.forEach(n => sortNodes(n.children));
  };
  sortNodes(roots);

  return roots;
}

// ─────────────────────────────────────────────────────────────────────────────
// Formatting helpers
// ─────────────────────────────────────────────────────────────────────────────

const fmtQty = (v: number | undefined | null): string => {
  if (v == null || v === 0) return '';
  return formatNumber(Number(v));
};

const fmtIdx = (v: number | undefined | null): string => {
  if (v == null || Number(v) === 0) return '';
  return Number(v).toFixed(4);
};

const fmtMoney = (v: number | undefined | null): string => {
  if (v == null || Number(v) === 0) return '';
  return formatMoney(Number(v));
};

// Number→string formatters for EditableCell (non-nullable input)
const fmtQtyNum = (v: number): string => v === 0 ? '' : formatNumber(v);
const fmtIdxNum = (v: number): string => v === 0 ? '' : v.toFixed(4);
const fmtMoneyNum = (v: number): string => v === 0 ? '' : formatMoney(v);

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

const LsrTreeTable: React.FC<LsrTreeTableProps> = ({ lines, onUpdateLine }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [expandedPositions, setExpandedPositions] = useState<Set<string>>(new Set());

  const tree = useMemo(() => buildTree(lines), [lines]);

  const allSectionIds = useMemo(() => {
    const ids = new Set<string>();
    tree.forEach(node => {
      if (node.line.lineType === 'SECTION') ids.add(node.line.id);
    });
    return ids;
  }, [tree]);

  const allPositionIds = useMemo(() => {
    const ids = new Set<string>();
    tree.forEach(section => {
      section.children.forEach(pos => {
        if (pos.line.lineType === 'POSITION') ids.add(pos.line.id);
      });
    });
    return ids;
  }, [tree]);

  const expandAll = useCallback(() => {
    setExpandedSections(new Set(allSectionIds));
    setExpandedPositions(new Set(allPositionIds));
  }, [allSectionIds, allPositionIds]);

  const collapseAll = useCallback(() => {
    setExpandedSections(new Set());
    setExpandedPositions(new Set());
  }, []);

  const toggleSection = useCallback((id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const togglePosition = useCallback((id: string) => {
    setExpandedPositions(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
        <div className="flex items-center gap-2">
          <FolderTree className="w-4 h-4 text-neutral-500" />
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {t('estimates.normative.treeViewMode')}
          </span>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={expandAll}>
            {t('estimates.normative.treeExpandAll')}
          </Button>
          <Button variant="ghost" size="sm" onClick={collapseAll}>
            {t('estimates.normative.treeCollapseAll')}
          </Button>
        </div>
      </div>

      {/* Single horizontal scroll container for headers + data */}
      <div className="overflow-x-auto">
        <div className={MIN_W}>
        {/* Row 1: Main headers — cols 1-4 individual, 5-7 "Количество", 8-12 "Сметная стоимость, руб." */}
        <div className={cn('grid gap-0 px-3 py-1.5 border-b border-neutral-300 dark:border-neutral-600 bg-neutral-100 dark:bg-neutral-800 text-[10px] font-bold text-neutral-600 dark:text-neutral-300 tracking-wide', GRID_COLS)}>
          <div className="flex items-center text-center leading-tight">
            {t('estimates.normative.col1Num')}
          </div>
          <div className="flex items-center leading-tight">
            {t('estimates.normative.col2Code')}
          </div>
          <div className="flex items-center leading-tight">
            {t('estimates.normative.col3Name')}
          </div>
          <div className="flex items-center leading-tight">
            {t('estimates.normative.col4Unit')}
          </div>
          <div className="col-span-3 text-center border-l border-neutral-300 dark:border-neutral-600 pl-1 flex items-center justify-center uppercase">
            {t('estimates.normative.grpQuantity')}
          </div>
          <div className="col-span-5 text-center border-l border-neutral-300 dark:border-neutral-600 pl-1 flex items-center justify-center uppercase">
            {t('estimates.normative.grpCost')}
          </div>
        </div>
        {/* Row 2: Sub-column names (only for cols 5-12) */}
        <div className={cn('grid gap-0 px-3 py-1 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 text-[10px] text-neutral-500 dark:text-neutral-400 leading-tight', GRID_COLS)}>
          <div />
          <div />
          <div />
          <div />
          <div className="text-center border-l border-neutral-200 dark:border-neutral-700 pl-1">
            {t('estimates.normative.col5QtyPerUnit')}
          </div>
          <div className="text-center">
            {t('estimates.normative.col6Coeff')}
          </div>
          <div className="text-center">
            {t('estimates.normative.col7QtyTotal')}
          </div>
          <div className="text-center border-l border-neutral-200 dark:border-neutral-700 pl-1">
            {t('estimates.normative.col8Basis')}
          </div>
          <div className="text-center">
            {t('estimates.normative.col9Index')}
          </div>
          <div className="text-center">
            {t('estimates.normative.col10Current')}
          </div>
          <div className="text-center">
            {t('estimates.normative.col11Coeffs')}
          </div>
          <div className="text-center">
            {t('estimates.normative.col12Total')}
          </div>
        </div>
        {/* Row 3: Column numbers 1-12 */}
        <div className={cn('grid gap-0 px-3 py-0.5 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 text-[10px] font-bold text-neutral-400 dark:text-neutral-500', GRID_COLS)}>
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} className={cn('text-center', i === 4 && 'border-l border-neutral-200 dark:border-neutral-700', i === 7 && 'border-l border-neutral-200 dark:border-neutral-700')}>
              {i + 1}
            </div>
          ))}
        </div>

        {/* Tree rows */}
          {tree.map(node => {
            const lt = node.line.lineType as LsrLineType | undefined;

            if (lt === 'SECTION') {
              return (
                <SectionRow
                  key={node.line.id}
                  node={node}
                  expanded={expandedSections.has(node.line.id)}
                  expandedPositions={expandedPositions}
                  onToggle={toggleSection}
                  onTogglePosition={togglePosition}
                  onUpdateLine={onUpdateLine}
                />
              );
            }

            if (lt === 'POSITION') {
              return (
                <PositionRow
                  key={node.line.id}
                  node={node}
                  expanded={expandedPositions.has(node.line.id)}
                  onToggle={togglePosition}
                  indentLevel={0}
                  onUpdateLine={onUpdateLine}
                />
              );
            }

            return <FlatRow key={node.line.id} line={node.line} onUpdateLine={onUpdateLine} />;
          })}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Section Row
// ─────────────────────────────────────────────────────────────────────────────

const SectionRow: React.FC<{
  node: TreeNode;
  expanded: boolean;
  expandedPositions: Set<string>;
  onToggle: (id: string) => void;
  onTogglePosition: (id: string) => void;
  onUpdateLine?: (lineId: string, field: string, value: string | number) => void;
}> = ({ node, expanded, expandedPositions, onToggle, onTogglePosition, onUpdateLine }) => {
  const sectionTotal = node.line.totalAmount ?? node.line.currentTotal;
  const posCount = node.children.filter(c => c.line.lineType === 'POSITION').length;

  return (
    <>
      <div
        className={cn('grid gap-0 px-3 py-2 bg-blue-50 dark:bg-blue-900/15 border-b border-neutral-200 dark:border-neutral-700 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/25 transition-colors overflow-hidden', GRID_COLS)}
        onClick={() => onToggle(node.line.id)}
      >
        <div className="flex items-center">
          {expanded
            ? <ChevronDown className="w-4 h-4 text-blue-500" />
            : <ChevronRight className="w-4 h-4 text-blue-500" />}
        </div>
        <div />
        <div className="flex items-center gap-2 col-span-1">
          <FolderTree className="w-4 h-4 text-blue-500 shrink-0" />
          <span className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 truncate">
            {node.line.sectionName || node.line.name}
          </span>
          <span className="text-xs text-neutral-400 shrink-0">
            ({posCount} {t('estimates.normative.posCount')})
          </span>
        </div>
        {/* Cols 4-11 empty */}
        <div className="col-span-8" />
        {/* Col 12: total */}
        <div className="text-right">
          {sectionTotal > 0 && (
            <span className="font-semibold text-sm tabular-nums">{formatMoney(sectionTotal)}</span>
          )}
        </div>
      </div>

      {expanded && node.children.map(child => {
        if (child.line.lineType === 'POSITION') {
          return (
            <PositionRow
              key={child.line.id}
              node={child}
              expanded={expandedPositions.has(child.line.id)}
              onToggle={onTogglePosition}
              indentLevel={1}
              onUpdateLine={onUpdateLine}
            />
          );
        }
        return <FlatRow key={child.line.id} line={child.line} indent={1} onUpdateLine={onUpdateLine} />;
      })}
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Position Row
// ─────────────────────────────────────────────────────────────────────────────

const PositionRow: React.FC<{
  node: TreeNode;
  expanded: boolean;
  onToggle: (id: string) => void;
  indentLevel: number;
  onUpdateLine?: (lineId: string, field: string, value: string | number) => void;
}> = ({ node, expanded, onToggle, indentLevel, onUpdateLine }) => {
  const line = node.line;
  const hasChildren = node.children.length > 0;
  const paddingLeft = 12 + indentLevel * 20;
  const ptBadgeColor = POSITION_BADGE_COLORS[line.positionType ?? ''] ?? POSITION_BADGE_COLORS.MANUAL;
  const editable = !!onUpdateLine;
  const save = (field: string) => (v: string | number) => onUpdateLine?.(line.id, field, v);

  return (
    <>
      <div
        className={cn(
          'grid gap-0 px-3 py-1.5 border-b border-neutral-100 dark:border-neutral-800 text-sm overflow-hidden',
          hasChildren && 'cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors',
          GRID_COLS,
        )}
        style={{ paddingLeft }}
        onClick={() => hasChildren && onToggle(line.id)}
      >
        {/* 1: № */}
        <div className="flex items-center text-neutral-500 tabular-nums text-xs">
          {hasChildren ? (
            expanded
              ? <ChevronDown className="w-3.5 h-3.5 text-neutral-400 mr-1" />
              : <ChevronRight className="w-3.5 h-3.5 text-neutral-400 mr-1" />
          ) : null}
          {line.lineNumber}
        </div>
        {/* 2: Обоснование */}
        <div className="flex items-center gap-1">
          {line.positionType && (
            <span className={cn('text-[10px] font-semibold px-1 py-0.5 rounded shrink-0', ptBadgeColor)}>
              {line.positionType}
            </span>
          )}
          <EditableCell
            value={line.justification}
            type="text"
            onSave={save('justification')}
            disabled={!editable}
            className="text-xs font-mono text-neutral-500"
          />
        </div>
        {/* 3: Наименование */}
        <div className="pr-2 min-w-0 overflow-hidden">
          <EditableCell
            value={line.name}
            type="text"
            onSave={save('name')}
            disabled={!editable}
            className="font-medium text-neutral-900 dark:text-neutral-100"
          />
        </div>
        {/* 4: Ед.изм. */}
        <EditableCell
          value={line.unit}
          type="text"
          onSave={save('unit')}
          disabled={!editable}
          className="text-neutral-500 text-xs"
        />
        {/* 5: Кол-во на ед. */}
        <div className="text-right tabular-nums text-xs text-neutral-500">
          {fmtQty(line.quantityPerUnit)}
        </div>
        {/* 6: Коэфф. */}
        <div className="text-right tabular-nums text-xs text-neutral-500">
          {fmtQty(line.quantityCoeff)}
        </div>
        {/* 7: Кол-во всего */}
        <EditableCell
          value={line.quantity}
          type="number"
          format={fmtQtyNum}
          onSave={save('quantity')}
          disabled={!editable}
          className="text-right tabular-nums font-medium"
          min={0}
        />
        {/* 8: Базис */}
        <EditableCell
          value={line.basePrice2001 ?? line.baseTotal}
          type="number"
          format={fmtMoneyNum}
          onSave={save('baseTotal')}
          disabled={!editable}
          className="text-right tabular-nums text-neutral-500"
        />
        {/* 9: Индекс */}
        <EditableCell
          value={line.priceIndex ?? line.laborIndex}
          type="number"
          format={fmtIdxNum}
          onSave={save('priceIndex')}
          disabled={!editable}
          className="text-right tabular-nums text-primary-600 dark:text-primary-400 font-medium text-xs"
          step={0.0001}
        />
        {/* 10: Текущая */}
        <EditableCell
          value={line.currentPrice ?? line.currentTotal}
          type="number"
          format={fmtMoneyNum}
          onSave={save('currentTotal')}
          disabled={!editable}
          className="text-right tabular-nums font-semibold"
        />
        {/* 11: Коэффициенты */}
        <EditableCell
          value={line.coefficients}
          type="text"
          onSave={save('coefficients')}
          disabled={!editable}
          className="text-right text-xs text-neutral-400"
          placeholder=""
        />
        {/* 12: Всего */}
        <EditableCell
          value={line.totalAmount ?? line.currentTotal}
          type="number"
          format={fmtMoneyNum}
          onSave={save('totalAmount')}
          disabled={!editable}
          className="text-right tabular-nums font-bold"
        />
      </div>

      {expanded && node.children.map(child => (
        <ResourceRow key={child.line.id} line={child.line} indentLevel={indentLevel + 1} onUpdateLine={onUpdateLine} />
      ))}
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Resource Row
// ─────────────────────────────────────────────────────────────────────────────

const ResourceRow: React.FC<{
  line: LocalEstimateLine;
  indentLevel: number;
  onUpdateLine?: (lineId: string, field: string, value: string | number) => void;
}> = ({ line, indentLevel, onUpdateLine }) => {
  const rt = line.resourceType as LsrResourceType | undefined;
  const colors = RESOURCE_COLORS[rt ?? ''] ?? { text: 'text-neutral-500', bg: '' };
  const labelKey = RESOURCE_LABELS[rt ?? ''];
  const paddingLeft = 12 + indentLevel * 20 + 16;
  const editable = !!onUpdateLine;
  const save = (field: string) => (v: string | number) => onUpdateLine?.(line.id, field, v);

  return (
    <div
      className={cn(
        'grid gap-0 px-3 py-1 border-b border-neutral-50 dark:border-neutral-800/50 text-xs overflow-hidden',
        colors.bg,
        GRID_COLS,
      )}
      style={{ paddingLeft }}
    >
      {/* 1: # */}
      <div />
      {/* 2: Code/type */}
      <div className={cn('font-mono font-semibold', colors.text)}>
        {rt ?? ''}
      </div>
      {/* 3: Name */}
      <EditableCell
        value={line.name || (labelKey ? t(labelKey) : '')}
        type="text"
        onSave={save('name')}
        disabled={!editable}
        className={cn('truncate', colors.text)}
      />
      {/* 4: Unit */}
      <EditableCell
        value={line.unit}
        type="text"
        onSave={save('unit')}
        disabled={!editable}
        className="text-neutral-400"
        placeholder=""
      />
      {/* 5: Qty per unit */}
      <div className="text-right tabular-nums text-neutral-400">
        {fmtQty(line.quantityPerUnit)}
      </div>
      {/* 6: Coeff */}
      <div className="text-right tabular-nums text-neutral-400">
        {fmtQty(line.quantityCoeff)}
      </div>
      {/* 7: Qty total */}
      <EditableCell
        value={line.quantity}
        type="number"
        format={fmtQtyNum}
        onSave={save('quantity')}
        disabled={!editable}
        className="text-right tabular-nums text-neutral-500"
        min={0}
      />
      {/* 8: Base */}
      <EditableCell
        value={line.baseLaborCost}
        type="number"
        format={fmtMoneyNum}
        onSave={save('baseLaborCost')}
        disabled={!editable}
        className="text-right tabular-nums text-neutral-400"
      />
      {/* 9: Index */}
      <EditableCell
        value={line.laborIndex}
        type="number"
        format={fmtIdxNum}
        onSave={save('laborIndex')}
        disabled={!editable}
        className="text-right tabular-nums text-neutral-400 text-[10px]"
        step={0.0001}
      />
      {/* 10: Current */}
      <EditableCell
        value={line.currentLaborCost}
        type="number"
        format={fmtMoneyNum}
        onSave={save('currentLaborCost')}
        disabled={!editable}
        className={cn('text-right tabular-nums', colors.text)}
      />
      {/* 11: Coefficients */}
      <EditableCell
        value={line.coefficients}
        type="text"
        onSave={save('coefficients')}
        disabled={!editable}
        className="text-right text-neutral-400"
        placeholder=""
      />
      {/* 12: Total */}
      <EditableCell
        value={line.totalAmount ?? line.currentTotal}
        type="number"
        format={fmtMoneyNum}
        onSave={save('totalAmount')}
        disabled={!editable}
        className={cn('text-right tabular-nums font-medium', colors.text)}
      />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Flat Row (fallback for lines without lineType)
// ─────────────────────────────────────────────────────────────────────────────

const FlatRow: React.FC<{
  line: LocalEstimateLine;
  indent?: number;
  onUpdateLine?: (lineId: string, field: string, value: string | number) => void;
}> = ({ line, indent = 0, onUpdateLine }) => {
  const paddingLeft = 12 + indent * 20;
  const editable = !!onUpdateLine;
  const save = (field: string) => (v: string | number) => onUpdateLine?.(line.id, field, v);

  return (
    <div
      className={cn('grid gap-0 px-3 py-1.5 border-b border-neutral-100 dark:border-neutral-800 text-sm overflow-hidden', GRID_COLS)}
      style={{ paddingLeft }}
    >
      <div className="text-neutral-500 tabular-nums text-xs">{line.lineNumber}</div>
      <EditableCell value={line.justification} type="text" onSave={save('justification')} disabled={!editable} className="text-xs font-mono text-neutral-500" />
      <EditableCell value={line.name} type="text" onSave={save('name')} disabled={!editable} className="text-neutral-900 dark:text-neutral-100 min-w-0" />
      <EditableCell value={line.unit} type="text" onSave={save('unit')} disabled={!editable} className="text-neutral-500 text-xs" />
      <div className="text-right tabular-nums text-neutral-500 text-xs">{fmtQty(line.quantityPerUnit)}</div>
      <div className="text-right tabular-nums text-neutral-500 text-xs">{fmtQty(line.quantityCoeff)}</div>
      <EditableCell value={line.quantity} type="number" format={fmtQtyNum} onSave={save('quantity')} disabled={!editable} className="text-right tabular-nums" min={0} />
      <EditableCell value={line.basePrice2001 ?? line.baseTotal} type="number" format={fmtMoneyNum} onSave={save('baseTotal')} disabled={!editable} className="text-right tabular-nums text-neutral-500" />
      <EditableCell value={line.priceIndex} type="number" format={fmtIdxNum} onSave={save('priceIndex')} disabled={!editable} className="text-right tabular-nums text-primary-600 dark:text-primary-400 font-medium text-xs" step={0.0001} />
      <EditableCell value={line.currentPrice ?? line.currentTotal} type="number" format={fmtMoneyNum} onSave={save('currentTotal')} disabled={!editable} className="text-right tabular-nums font-semibold" />
      <EditableCell value={line.coefficients} type="text" onSave={save('coefficients')} disabled={!editable} className="text-right text-xs text-neutral-400" placeholder="" />
      <EditableCell value={line.currentTotal} type="number" format={fmtMoneyNum} onSave={save('totalAmount')} disabled={!editable} className="text-right tabular-nums font-semibold" />
    </div>
  );
};

export default LsrTreeTable;
