import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { costCodesApi, type CostCode } from '@/api/costCodes';
import { PageHeader } from '@/design-system/components/PageHeader';
import { t } from '@/i18n';
import { Search, Plus, ChevronRight, ChevronDown, Trash2, Pencil, PlusCircle, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { ConfirmDialog } from '@/design-system/components/ConfirmDialog';

// ---------- Helpers ----------

const STANDARD_BADGE: Record<string, { label: () => string; cls: string }> = {
  CSI: { label: () => t('costCodes.standardCSI'), cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  GESN: { label: () => t('costCodes.standardGESN'), cls: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  CUSTOM: { label: () => t('costCodes.standardCustom'), cls: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300' },
};

// Flatten tree with depth for searching
function flattenTree(nodes: CostCode[], depth = 0): (CostCode & { depth: number })[] {
  const result: (CostCode & { depth: number })[] = [];
  for (const node of nodes) {
    result.push({ ...node, depth });
    if (node.children) {
      result.push(...flattenTree(node.children, depth + 1));
    }
  }
  return result;
}

// ---------- Sub-components ----------

interface TreeRowProps {
  node: CostCode;
  depth: number;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onEdit: (node: CostCode) => void;
  onAddChild: (parentId: string) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, active: boolean) => void;
}

const TreeRow: React.FC<TreeRowProps> = ({ node, depth, expanded, onToggle, onEdit, onAddChild, onDelete, onToggleActive }) => {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expanded.has(node.id);
  const badge = STANDARD_BADGE[node.standard] || STANDARD_BADGE.CUSTOM;

  return (
    <>
      <tr className="group hover:bg-blue-50/40 dark:hover:bg-neutral-800/30 border-b border-neutral-100 dark:border-neutral-800">
        <td className="px-3 py-2 text-sm">
          <div className="flex items-center" style={{ paddingLeft: `${depth * 20}px` }}>
            {hasChildren ? (
              <button
                onClick={() => onToggle(node.id)}
                className="p-0.5 mr-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 rounded transition-colors"
              >
                {isExpanded
                  ? <ChevronDown className="w-4 h-4" />
                  : <ChevronRight className="w-4 h-4" />
                }
              </button>
            ) : (
              <span className="w-5 mr-1.5 inline-block" />
            )}
            <span className="font-mono text-xs font-medium text-neutral-600 dark:text-neutral-400 mr-2 min-w-[40px]">
              {node.code}
            </span>
          </div>
        </td>
        <td className="px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 font-medium">
          {node.name}
        </td>
        <td className="px-3 py-2 text-sm">
          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${badge.cls}`}>
            {badge.label()}
          </span>
        </td>
        <td className="px-3 py-2 text-sm text-center">
          <button
            onClick={() => onToggleActive(node.id, !node.isActive)}
            className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
              node.isActive
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-600'
            }`}
          >
            {node.isActive ? t('costCodes.active') : t('costCodes.inactive')}
          </button>
        </td>
        <td className="px-3 py-2 text-sm text-right">
          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onAddChild(node.id)}
              className="p-1 text-neutral-400 hover:text-blue-600 rounded transition-colors"
              title={t('costCodes.addChild')}
            >
              <PlusCircle className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onEdit(node)}
              className="p-1 text-neutral-400 hover:text-blue-600 rounded transition-colors"
              title={t('costCodes.editCode')}
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(node.id)}
              className="p-1 text-neutral-400 hover:text-red-500 dark:hover:text-red-400 rounded transition-colors"
              title={t('costCodes.deleteConfirm')}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </td>
      </tr>
      {hasChildren && isExpanded && node.children!.map((child) => (
        <TreeRow
          key={child.id}
          node={child}
          depth={depth + 1}
          expanded={expanded}
          onToggle={onToggle}
          onEdit={onEdit}
          onAddChild={onAddChild}
          onDelete={onDelete}
          onToggleActive={onToggleActive}
        />
      ))}
    </>
  );
};

// ---------- Modal ----------

interface CostCodeModalProps {
  open: boolean;
  onClose: () => void;
  editNode?: CostCode | null;
  parentId?: string | null;
}

const CostCodeModal: React.FC<CostCodeModalProps> = ({ open, onClose, editNode, parentId }) => {
  const queryClient = useQueryClient();
  const [code, setCode] = useState(editNode?.code ?? '');
  const [name, setName] = useState(editNode?.name ?? '');
  const [description, setDescription] = useState(editNode?.description ?? '');
  const [standard, setStandard] = useState<string>(editNode?.standard ?? 'CUSTOM');

  React.useEffect(() => {
    setCode(editNode?.code ?? '');
    setName(editNode?.name ?? '');
    setDescription(editNode?.description ?? '');
    setStandard(editNode?.standard ?? 'CUSTOM');
  }, [editNode, open]);

  const createMutation = useMutation({
    mutationFn: (payload: Partial<CostCode>) => costCodesApi.createCostCode(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-codes-tree'] });
      queryClient.invalidateQueries({ queryKey: ['cost-codes-flat'] });
      toast.success(t('common.saved'));
      onClose();
    },
    onError: () => toast.error(t('errors.unexpectedError')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CostCode> }) =>
      costCodesApi.updateCostCode(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-codes-tree'] });
      queryClient.invalidateQueries({ queryKey: ['cost-codes-flat'] });
      toast.success(t('common.saved'));
      onClose();
    },
    onError: () => toast.error(t('errors.unexpectedError')),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;

    if (editNode) {
      updateMutation.mutate({
        id: editNode.id,
        payload: { name: name.trim(), description: description.trim() || undefined },
      });
    } else {
      createMutation.mutate({
        code: code.trim(),
        name: name.trim(),
        description: description.trim() || undefined,
        parentId: parentId ?? undefined,
        standard: standard as CostCode['standard'],
      });
    }
  };

  if (!open) return null;

  const inputCls = 'w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500';
  const labelCls = 'block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1';
  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {editNode ? t('costCodes.editCode') : t('costCodes.addCode')}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg">
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label className={labelCls}>{t('costCodes.code')} *</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className={inputCls}
              disabled={!!editNode}
              required
              maxLength={20}
            />
          </div>
          <div>
            <label className={labelCls}>{t('costCodes.name')} *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} required />
          </div>
          <div>
            <label className={labelCls}>{t('costCodes.description')}</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={inputCls} rows={2} />
          </div>
          {!editNode && (
            <div>
              <label className={labelCls}>{t('costCodes.standard')}</label>
              <select value={standard} onChange={(e) => setStandard(e.target.value as 'GESN' | 'CUSTOM')} className={inputCls}>
                <option value="CUSTOM">{t('costCodes.standardCustom')}</option>
                <option value="GESN">{t('costCodes.standardGESN')}</option>
              </select>
            </div>
          )}
        </form>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-neutral-200 dark:border-neutral-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSubmit as unknown as React.MouseEventHandler}
            disabled={!code.trim() || !name.trim() || isPending}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {editNode ? t('common.save') : t('common.create')}
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------- Main page ----------

const CostCodeBrowserPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [editNode, setEditNode] = useState<CostCode | null>(null);
  const [addParentId, setAddParentId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { data: tree = [], isLoading } = useQuery({
    queryKey: ['cost-codes-tree'],
    queryFn: costCodesApi.getTree,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => costCodesApi.deleteCostCode(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-codes-tree'] });
      queryClient.invalidateQueries({ queryKey: ['cost-codes-flat'] });
      toast.success(t('common.deleted'));
    },
    onError: () => toast.error(t('errors.unexpectedError')),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      costCodesApi.updateCostCode(id, { isActive: active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-codes-tree'] });
    },
    onError: () => toast.error(t('errors.unexpectedError')),
  });

  const seedMutation = useMutation({
    mutationFn: (standard: 'CSI' | 'GESN') => costCodesApi.seedStandard(standard),
    onSuccess: (_data, standard) => {
      queryClient.invalidateQueries({ queryKey: ['cost-codes-tree'] });
      queryClient.invalidateQueries({ queryKey: ['cost-codes-flat'] });
      toast.success(`${t('costCodes.seedSuccess')} (${standard})`);
    },
    onError: () => toast.error(t('errors.unexpectedError')),
  });

  // Flatten and filter for search
  const flat = useMemo(() => flattenTree(tree), [tree]);
  const filtered = useMemo(() => {
    if (!search) return null; // null = use tree view
    const lower = search.toLowerCase();
    return flat.filter(
      (n) => n.code.toLowerCase().includes(lower) || n.name.toLowerCase().includes(lower),
    );
  }, [flat, search]);

  const toggleExpanded = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const handleDelete = useCallback((id: string) => {
    setDeleteConfirmId(id);
  }, []);

  const handleEdit = useCallback((node: CostCode) => {
    setEditNode(node);
    setAddParentId(null);
    setModalOpen(true);
  }, []);

  const handleAddChild = useCallback((parentId: string) => {
    setEditNode(null);
    setAddParentId(parentId);
    setModalOpen(true);
    // Also expand parent
    setExpanded((prev) => new Set(prev).add(parentId));
  }, []);

  const handleAddRoot = useCallback(() => {
    setEditNode(null);
    setAddParentId(null);
    setModalOpen(true);
  }, []);

  const handleToggleActive = useCallback((id: string, active: boolean) => {
    toggleActiveMutation.mutate({ id, active });
  }, [toggleActiveMutation]);

  const thCls = 'px-3 py-2 text-xs font-medium text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 whitespace-nowrap';

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('costCodes.title')}
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('costCodes.title') },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => seedMutation.mutate('GESN')}
              disabled={seedMutation.isPending}
              className="px-3 py-1.5 text-sm bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/50 transition-colors disabled:opacity-50"
            >
              {t('costCodes.seedGESN')}
            </button>
            <button
              onClick={handleAddRoot}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t('costCodes.addCode')}
            </button>
          </div>
        }
      />

      {/* Search */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            placeholder={t('costCodes.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Tree table */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-neutral-400">{t('common.loading')}</div>
        ) : (filtered ?? tree).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
            <p className="text-sm">{t('costCodes.noCodes')}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr>
                <th className={`${thCls} text-left w-[200px]`}>{t('costCodes.code')}</th>
                <th className={`${thCls} text-left`}>{t('costCodes.name')}</th>
                <th className={`${thCls} text-left w-[140px]`}>{t('costCodes.standard')}</th>
                <th className={`${thCls} text-center w-[100px]`}>{t('costCodes.active')}</th>
                <th className={`${thCls} w-[100px]`} />
              </tr>
            </thead>
            <tbody>
              {filtered
                ? filtered.map((node) => (
                    <tr key={node.id} className="group hover:bg-blue-50/40 dark:hover:bg-neutral-800/30 border-b border-neutral-100 dark:border-neutral-800">
                      <td className="px-3 py-2 text-sm">
                        <span className="font-mono text-xs font-medium text-neutral-600 dark:text-neutral-400">
                          {node.code}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 font-medium">
                        {node.name}
                      </td>
                      <td className="px-3 py-2 text-sm">
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${(STANDARD_BADGE[node.standard] || STANDARD_BADGE.CUSTOM).cls}`}>
                          {(STANDARD_BADGE[node.standard] || STANDARD_BADGE.CUSTOM).label()}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-sm text-center">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          node.isActive
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400'
                        }`}>
                          {node.isActive ? t('costCodes.active') : t('costCodes.inactive')}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-sm text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEdit(node)}
                            className="p-1 text-neutral-400 hover:text-blue-600 rounded transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(node.id)}
                            className="p-1 text-neutral-400 hover:text-red-500 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                : tree.map((node) => (
                    <TreeRow
                      key={node.id}
                      node={node}
                      depth={0}
                      expanded={expanded}
                      onToggle={toggleExpanded}
                      onEdit={handleEdit}
                      onAddChild={handleAddChild}
                      onDelete={handleDelete}
                      onToggleActive={handleToggleActive}
                    />
                  ))
              }
            </tbody>
          </table>
        )}
      </div>

      <CostCodeModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editNode={editNode}
        parentId={addParentId}
      />

      <ConfirmDialog
        open={!!deleteConfirmId}
        title={t('costCodes.deleteConfirm')}
        description={t('costCodes.deleteConfirmDesc')}
        confirmLabel={t('common.delete')}
        confirmVariant="danger"
        onConfirm={() => {
          if (deleteConfirmId) deleteMutation.mutate(deleteConfirmId);
          setDeleteConfirmId(null);
        }}
        onClose={() => setDeleteConfirmId(null)}
      />
    </div>
  );
};

export default CostCodeBrowserPage;
