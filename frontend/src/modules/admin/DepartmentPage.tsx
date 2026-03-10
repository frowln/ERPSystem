import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2, Plus, ChevronRight, ChevronDown, Pencil, Trash2,
  FolderTree, Search, ChevronsUpDown, Layers, GitBranch,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Input, Select, Textarea } from '@/design-system/components/FormField';
import { useConfirmDialog } from '@/design-system/components/ConfirmDialog/provider';
import { t } from '@/i18n';
import { adminApi, type Department } from '@/api/admin';
import toast from 'react-hot-toast';

/* ─── Tree helpers ─────────────────────────────────────────────── */

interface DeptNode extends Department {
  children: DeptNode[];
  level: number;
}

function buildTree(departments: Department[]): DeptNode[] {
  const map = new Map<string, DeptNode>();
  const roots: DeptNode[] = [];

  for (const d of departments) {
    map.set(d.id, { ...d, children: [], level: 0 });
  }

  for (const node of map.values()) {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  function setLevels(nodes: DeptNode[], level: number) {
    for (const n of nodes) {
      n.level = level;
      setLevels(n.children, level + 1);
    }
  }
  setLevels(roots, 0);

  roots.sort((a, b) => a.sortOrder - b.sortOrder);
  for (const node of map.values()) {
    node.children.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  return roots;
}

function flattenTree(nodes: DeptNode[]): DeptNode[] {
  const result: DeptNode[] = [];
  function walk(items: DeptNode[]) {
    for (const n of items) {
      result.push(n);
      walk(n.children);
    }
  }
  walk(nodes);
  return result;
}

function getMaxDepth(nodes: DeptNode[]): number {
  if (nodes.length === 0) return 0;
  let max = 1;
  function walk(items: DeptNode[], depth: number) {
    for (const n of items) {
      if (depth > max) max = depth;
      walk(n.children, depth + 1);
    }
  }
  walk(nodes, 1);
  return max;
}

function getAllParentIds(departments: Department[]): Set<string> {
  const childParents = new Set(departments.filter((d) => d.parentId).map((d) => d.parentId!));
  return new Set(departments.filter((d) => childParents.has(d.id)).map((d) => d.id));
}

/* ─── Form ─────────────────────────────────────────────────────── */

interface DeptFormData {
  name: string;
  code: string;
  parentId: string;
  description: string;
  sortOrder: string;
}

const emptyForm: DeptFormData = { name: '', code: '', parentId: '', description: '', sortOrder: '0' };

/* ─── Component ────────────────────────────────────────────────── */

const DepartmentPage: React.FC = () => {
  const queryClient = useQueryClient();
  const confirmDialog = useConfirmDialog();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [expandedInit, setExpandedInit] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<DeptFormData>(emptyForm);
  const [search, setSearch] = useState('');

  const { data: departments = [], isLoading } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: adminApi.getDepartments,
  });

  // Expand all parent nodes on first load
  if (!expandedInit && departments.length > 0) {
    const parents = getAllParentIds(departments);
    if (parents.size > 0) setExpanded(parents);
    setExpandedInit(true);
  }

  const tree = useMemo(() => buildTree(departments), [departments]);
  const flat = useMemo(() => flattenTree(tree), [tree]);

  // Search filter
  const searchLower = search.toLowerCase().trim();
  const matchingIds = useMemo(() => {
    if (!searchLower) return null;
    const matched = new Set<string>();
    for (const d of departments) {
      if (d.name.toLowerCase().includes(searchLower) || (d.code?.toLowerCase().includes(searchLower))) {
        matched.add(d.id);
        // Also include all ancestors so the path is visible
        let parentId = d.parentId;
        while (parentId) {
          matched.add(parentId);
          const parent = departments.find((p) => p.id === parentId);
          parentId = parent?.parentId;
        }
      }
    }
    return matched;
  }, [departments, searchLower]);

  // Stats
  const rootCount = tree.length;
  const maxDepth = useMemo(() => getMaxDepth(tree), [tree]);
  const withChildren = useMemo(() => flat.filter((n) => n.children.length > 0).length, [flat]);

  /* ─── Mutations ────────────────────────────────────────── */

  const createMutation = useMutation({
    mutationFn: (data: DeptFormData) => adminApi.createDepartment({
      name: data.name,
      code: data.code || undefined,
      parentId: data.parentId || undefined,
      description: data.description || undefined,
      sortOrder: parseInt(data.sortOrder, 10) || 0,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success(t('admin.departments.toastCreated'));
      setShowForm(false);
      setForm(emptyForm);
    },
    onError: () => toast.error(t('admin.departments.toastCreateError')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: DeptFormData }) => adminApi.updateDepartment(id, {
      name: data.name,
      code: data.code || undefined,
      parentId: data.parentId || null,
      description: data.description || undefined,
      sortOrder: parseInt(data.sortOrder, 10) || 0,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success(t('admin.departments.toastUpdated'));
      setEditingId(null);
      setForm(emptyForm);
    },
    onError: () => toast.error(t('admin.departments.toastUpdateError')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteDepartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success(t('admin.departments.toastDeleted'));
      if (editingId) { setEditingId(null); setForm(emptyForm); }
    },
    onError: () => toast.error(t('admin.departments.toastDeleteError')),
  });

  /* ─── Handlers ─────────────────────────────────────────── */

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const expandAll = () => setExpanded(getAllParentIds(departments));
  const collapseAll = () => setExpanded(new Set());

  const startEdit = (dept: DeptNode) => {
    setEditingId(dept.id);
    setForm({
      name: dept.name,
      code: dept.code ?? '',
      parentId: dept.parentId ?? '',
      description: dept.description ?? '',
      sortOrder: String(dept.sortOrder ?? 0),
    });
    setShowForm(false);
  };

  const startCreate = (parentId?: string) => {
    setEditingId(null);
    setForm({ ...emptyForm, parentId: parentId ?? '' });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleDelete = async (node: DeptNode) => {
    if (node.children.length > 0) {
      toast.error(t('admin.departments.toastDeleteChildrenFirst'));
      return;
    }
    const confirmed = await confirmDialog({
      title: t('admin.departments.confirmDeleteTitle'),
      description: t('admin.departments.confirmDelete'),
      confirmLabel: t('admin.departments.deleteDepartment'),
      confirmVariant: 'danger',
    });
    if (confirmed) deleteMutation.mutate(node.id);
  };

  const isChildOf = (nodeId: string, parentId: string): boolean => {
    let current = departments.find((d) => d.id === nodeId);
    while (current?.parentId) {
      if (current.parentId === parentId) return true;
      current = departments.find((d) => d.id === current!.parentId);
    }
    return false;
  };

  const isAncestorCollapsed = (node: DeptNode): boolean => {
    let checkId = node.parentId;
    while (checkId) {
      if (!expanded.has(checkId)) return true;
      const parent = departments.find((d) => d.id === checkId);
      checkId = parent?.parentId;
    }
    return false;
  };

  /* ─── Render ───────────────────────────────────────────── */

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={t('admin.departments.title')}
        subtitle={t('admin.departments.subtitle', { count: departments.length })}
        breadcrumbs={[
          { label: t('navigation.items.dashboard'), href: '/' },
          { label: t('adminDashboard.title'), href: '/admin/dashboard' },
          { label: t('admin.departments.title') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => startCreate()}>
            {t('admin.departments.addDepartment')}
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={<Building2 className="h-5 w-5 text-primary-600 dark:text-primary-400" />}
          label={t('admin.departments.statTotal')}
          value={departments.length}
          compact
        />
        <MetricCard
          icon={<Layers className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
          label={t('admin.departments.statRoot')}
          value={rootCount}
          compact
        />
        <MetricCard
          icon={<GitBranch className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
          label={t('admin.departments.statWithChildren')}
          value={withChildren}
          compact
        />
        <MetricCard
          icon={<FolderTree className="h-5 w-5 text-green-600 dark:text-green-400" />}
          label={t('admin.departments.statMaxDepth')}
          value={maxDepth}
          compact
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tree panel */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          {/* Toolbar: search + expand/collapse */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 dark:text-neutral-500" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('admin.departments.searchPlaceholder')}
                className="pl-9"
              />
            </div>
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<ChevronsUpDown size={14} />}
              onClick={() => expanded.size > 0 ? collapseAll() : expandAll()}
            >
              {expanded.size > 0 ? t('admin.departments.collapseAll') : t('admin.departments.expandAll')}
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-8 w-8 border-2 border-primary-600 dark:border-primary-400 border-t-transparent rounded-full" />
            </div>
          ) : flat.length === 0 ? (
            <div className="text-center py-12 text-neutral-400 dark:text-neutral-500">
              <FolderTree className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">{t('admin.departments.emptyState')}</p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {flat.map((node) => {
                const hasChildren = node.children.length > 0;
                const isExpanded = expanded.has(node.id);

                // Skip collapsed ancestors
                if (node.level > 0 && isAncestorCollapsed(node)) return null;

                // Skip search non-matches
                if (matchingIds && !matchingIds.has(node.id)) return null;

                const isDirectMatch = searchLower && (
                  node.name.toLowerCase().includes(searchLower) ||
                  (node.code?.toLowerCase().includes(searchLower))
                );

                return (
                  <div
                    key={node.id}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors',
                      editingId === node.id && 'bg-primary-50/50 dark:bg-primary-900/10',
                      isDirectMatch && 'bg-yellow-50/50 dark:bg-yellow-900/10',
                    )}
                    style={{ paddingLeft: `${16 + node.level * 28}px` }}
                  >
                    <button
                      onClick={() => hasChildren && toggleExpand(node.id)}
                      className={cn(
                        'w-5 h-5 flex items-center justify-center shrink-0',
                        hasChildren
                          ? 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
                          : 'invisible',
                      )}
                    >
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>

                    <div className="p-1.5 rounded-lg bg-primary-50 dark:bg-primary-900/20 shrink-0">
                      <Building2 className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                        {node.name}
                        {node.code && (
                          <span className="ml-2 text-xs text-neutral-400 dark:text-neutral-500 font-mono">
                            ({node.code})
                          </span>
                        )}
                      </p>
                      {node.description && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                          {node.description}
                        </p>
                      )}
                    </div>

                    {hasChildren && (
                      <span className="flex items-center gap-1 text-xs text-neutral-400 dark:text-neutral-500 shrink-0" title={t('admin.departments.childCount', { count: node.children.length })}>
                        <GitBranch size={12} />
                        {node.children.length}
                      </span>
                    )}

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => startCreate(node.id)}
                        className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400"
                        title={t('admin.departments.addSubdepartment')}
                      >
                        <Plus size={14} />
                      </button>
                      <button
                        onClick={() => startEdit(node)}
                        className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-400 hover:text-amber-600 dark:hover:text-amber-400"
                        title={t('admin.departments.editDepartment')}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(node)}
                        className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-400 hover:text-red-600 dark:hover:text-red-400"
                        title={t('admin.departments.deleteDepartment')}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
              {matchingIds && matchingIds.size === 0 && (
                <div className="text-center py-8 text-neutral-400 dark:text-neutral-500 text-sm">
                  {t('admin.departments.searchNoResults')}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Form panel */}
        {(showForm || editingId) && (
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5 h-fit">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              {editingId ? t('admin.departments.formTitleEdit') : t('admin.departments.formTitleCreate')}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                  {t('admin.departments.labelName')} *
                </label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={t('admin.departments.placeholderName')}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                  {t('admin.departments.labelCode')}
                </label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder={t('admin.departments.placeholderCode')}
                  className="font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                  {t('admin.departments.labelParent')}
                </label>
                <Select
                  value={form.parentId}
                  onChange={(e) => setForm({ ...form, parentId: e.target.value })}
                  options={[
                    { value: '', label: t('admin.departments.optionRoot') },
                    ...departments
                      .filter((d) => d.id !== editingId && !isChildOf(d.id, editingId ?? ''))
                      .map((d) => ({ value: d.id, label: d.name })),
                  ]}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                  {t('admin.departments.labelSortOrder')}
                </label>
                <Input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                  min={0}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                  {t('admin.departments.labelDescription')}
                </label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  placeholder={t('admin.departments.placeholderDescription')}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleSubmit}
                  disabled={!form.name.trim() || createMutation.isPending || updateMutation.isPending}
                >
                  {editingId ? t('admin.departments.btnSave') : t('admin.departments.btnCreate')}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => { setEditingId(null); setShowForm(false); setForm(emptyForm); }}
                >
                  {t('admin.departments.btnCancel')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DepartmentPage;
