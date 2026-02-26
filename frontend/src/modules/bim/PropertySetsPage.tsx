import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Download,
  Layers,
  ChevronRight,
  ChevronDown,
  Box,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Input } from '@/design-system/components/FormField';
import { bimApi } from '@/api/bim';
import type { BimPropertySet } from '@/modules/bim/types';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';

interface TreeNode {
  key: string;
  label: string;
  children?: TreeNode[];
  element?: BimPropertySet;
}

const PropertySetsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const [selectedElement, setSelectedElement] = useState<BimPropertySet | null>(null);

  const { data: elements = [], isLoading } = useQuery({
    queryKey: ['property-sets'],
    queryFn: () => bimApi.getPropertySets(),
  });

  // Build tree: category -> elementType -> individual elements
  const tree = useMemo<TreeNode[]>(() => {
    const categoryMap = new Map<string, Map<string, BimPropertySet[]>>();
    const filtered = search
      ? elements.filter((el) => {
          const lower = search.toLowerCase();
          return (
            el.elementName.toLowerCase().includes(lower) ||
            el.elementType.toLowerCase().includes(lower) ||
            el.category.toLowerCase().includes(lower) ||
            el.properties.some(
              (p) =>
                p.name.toLowerCase().includes(lower) ||
                p.value.toLowerCase().includes(lower),
            )
          );
        })
      : elements;

    for (const el of filtered) {
      if (!categoryMap.has(el.category)) {
        categoryMap.set(el.category, new Map());
      }
      const typeMap = categoryMap.get(el.category)!;
      if (!typeMap.has(el.elementType)) {
        typeMap.set(el.elementType, []);
      }
      typeMap.get(el.elementType)!.push(el);
    }

    return Array.from(categoryMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([category, typeMap]) => ({
        key: `cat:${category}`,
        label: category,
        children: Array.from(typeMap.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([type, els]) => ({
            key: `type:${category}:${type}`,
            label: `${type} (${els.length})`,
            children: els.map((el) => ({
              key: `el:${el.elementId}`,
              label: el.elementName,
              element: el,
            })),
          })),
      }));
  }, [elements, search]);

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const totalElements = elements.length;
  const categories = new Set(elements.map((e) => e.category)).size;
  const missingProps = elements.filter(
    (e) => e.properties.length === 0 || e.properties.some((p) => !p.value),
  ).length;

  const handleExportCsv = () => {
    toast.success(t('bim.propSetsExportToast'));
  };

  const renderNode = (node: TreeNode, depth: number) => {
    const isExpanded = expandedKeys.has(node.key);
    const hasChildren = node.children && node.children.length > 0;
    const isElement = !!node.element;

    return (
      <div key={node.key}>
        <button
          onClick={() => {
            if (hasChildren) toggleExpand(node.key);
            if (isElement && node.element) setSelectedElement(node.element);
          }}
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors rounded-md',
            isElement && selectedElement?.elementId === node.element?.elementId
              ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
              : 'text-neutral-700 dark:text-neutral-300',
          )}
          style={{ paddingLeft: `${depth * 20 + 12}px` }}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown size={14} className="flex-shrink-0" />
            ) : (
              <ChevronRight size={14} className="flex-shrink-0" />
            )
          ) : (
            <Box size={14} className="flex-shrink-0 text-neutral-400" />
          )}
          <span
            className={cn(
              'truncate',
              !isElement && 'font-medium',
              depth === 0 && 'font-semibold',
            )}
          >
            {node.label}
          </span>
          {depth === 0 && node.children && (
            <span className="ml-auto text-xs text-neutral-400">
              {node.children.length} {t('bim.propSetsTypesCount')}
            </span>
          )}
        </button>
        {hasChildren && isExpanded && (
          <div>
            {node.children!.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('bim.propSetsTitle')}
        subtitle={t('bim.propSetsSubtitle', { count: String(totalElements) })}
        breadcrumbs={[
          { label: t('bim.breadcrumbHome'), href: '/' },
          { label: t('bim.breadcrumbBim') },
          { label: t('bim.propSetsBreadcrumb') },
        ]}
        actions={
          <Button
            variant="secondary"
            iconLeft={<Download size={16} />}
            onClick={handleExportCsv}
          >
            {t('bim.propSetsExportCsv')}
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <MetricCard
          icon={<Box size={18} />}
          label={t('bim.propSetsMetricTotal')}
          value={totalElements}
          loading={isLoading}
        />
        <MetricCard
          icon={<Layers size={18} />}
          label={t('bim.propSetsMetricCategories')}
          value={categories}
          loading={isLoading}
        />
        <MetricCard
          icon={<AlertTriangle size={18} />}
          label={t('bim.propSetsMetricMissing')}
          value={missingProps}
          loading={isLoading}
        />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <Input
            placeholder={t('bim.propSetsSearchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Tree panel */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
            <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
              {t('bim.propSetsTreeTitle')}
            </h3>
          </div>
          <div className="p-2 max-h-[60vh] overflow-y-auto">
            {isLoading ? (
              <div className="space-y-2 p-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-8 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse"
                  />
                ))}
              </div>
            ) : tree.length === 0 ? (
              <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-8">
                {t('bim.propSetsEmptyTree')}
              </p>
            ) : (
              tree.map((node) => renderNode(node, 0))
            )}
          </div>
        </div>

        {/* Properties panel */}
        <div className="lg:col-span-3 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
            <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
              {selectedElement
                ? selectedElement.elementName
                : t('bim.propSetsPanelTitle')}
            </h3>
            {selectedElement && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                {selectedElement.elementType} | {selectedElement.category}
              </p>
            )}
          </div>
          <div className="p-4 max-h-[60vh] overflow-y-auto">
            {!selectedElement ? (
              <div className="flex flex-col items-center justify-center py-12 text-neutral-400 dark:text-neutral-500">
                <Box size={40} className="mb-3" />
                <p className="text-sm">{t('bim.propSetsSelectElement')}</p>
              </div>
            ) : selectedElement.properties.length === 0 ? (
              <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-8">
                {t('bim.propSetsNoProperties')}
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-700">
                    <th className="text-left py-2 px-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">
                      {t('bim.propSetsColName')}
                    </th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">
                      {t('bim.propSetsColValue')}
                    </th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">
                      {t('bim.propSetsColUnit')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {selectedElement.properties.map((prop, idx) => (
                    <tr
                      key={idx}
                      className={cn(
                        'border-b border-neutral-100 dark:border-neutral-800',
                        idx % 2 === 1
                          ? 'bg-neutral-25 dark:bg-neutral-800/30'
                          : '',
                      )}
                    >
                      <td className="py-2 px-3 text-neutral-600 dark:text-neutral-400 font-medium">
                        {prop.name}
                      </td>
                      <td className="py-2 px-3 text-neutral-900 dark:text-neutral-100">
                        {prop.value || (
                          <span className="text-neutral-400 italic">
                            {t('bim.propSetsEmpty')}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-neutral-500 dark:text-neutral-400">
                        {prop.unit ?? ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertySetsPage;
