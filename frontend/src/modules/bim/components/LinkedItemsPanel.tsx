import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Link2,
  Plus,
  X,
  Search,
  AlertTriangle,
  FileText,
  MessageSquare,
  ClipboardList,
  Bug,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/design-system/components/Button';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Modal } from '@/design-system/components/Modal';
import { Input, Select } from '@/design-system/components/FormField';
import { bimApi, type BimLinkedItem, type BimLinkedEntityType } from '@/api/bim';
import { issuesApi } from '@/api/issues';
import { cn } from '@/lib/cn';
import { formatRelativeTime } from '@/lib/format';
import { t } from '@/i18n';
import toast from 'react-hot-toast';

interface LinkedItemsPanelProps {
  clashId: string;
  className?: string;
}

const entityTypeIconMap: Record<BimLinkedEntityType, React.ReactNode> = {
  ISSUE: <ClipboardList size={14} />,
  RFI: <MessageSquare size={14} />,
  CHANGE_ORDER: <FileText size={14} />,
  DEFECT: <Bug size={14} />,
};

const entityTypeColorMap: Record<string, 'blue' | 'purple' | 'orange' | 'red'> = {
  ISSUE: 'blue',
  RFI: 'purple',
  CHANGE_ORDER: 'orange',
  DEFECT: 'red',
};

const getEntityTypeLabel = (type: BimLinkedEntityType): string => {
  const labels: Record<BimLinkedEntityType, string> = {
    ISSUE: t('bim.linking.entityTypeIssue'),
    RFI: t('bim.linking.entityTypeRfi'),
    CHANGE_ORDER: t('bim.linking.entityTypeChangeOrder'),
    DEFECT: t('bim.linking.entityTypeDefect'),
  };
  return labels[type];
};

const getEntityRoute = (type: BimLinkedEntityType, entityId: string): string => {
  switch (type) {
    case 'ISSUE': return `/pm/issues/${entityId}`;
    case 'RFI': return `/pm/rfi/${entityId}`;
    case 'CHANGE_ORDER': return `/change-management/orders/${entityId}`;
    case 'DEFECT': return `/defects/${entityId}`;
  }
};

// Searchable entity for the link modal
interface SearchableEntity {
  id: string;
  title: string;
  status: string;
  code?: string;
}

const LinkedItemsPanel: React.FC<LinkedItemsPanelProps> = ({ clashId, className }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkEntityType, setLinkEntityType] = useState<BimLinkedEntityType>('ISSUE');
  const [linkSearch, setLinkSearch] = useState('');
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);

  const { data: linkedItems = [], isLoading } = useQuery({
    queryKey: ['bim-clash-linked-items', clashId],
    queryFn: () => bimApi.getClashLinkedItems(clashId),
    enabled: !!clashId,
  });

  // Search for entities to link
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['bim-link-search', linkEntityType, linkSearch],
    queryFn: async (): Promise<SearchableEntity[]> => {
      if (linkEntityType === 'ISSUE') {
        const result = await issuesApi.getIssues({ search: linkSearch, size: 10 });
        return result.content.map((i) => ({
          id: i.id,
          title: i.title ?? i.number ?? i.id,
          status: i.status,
          code: i.number,
        }));
      }
      // For other entity types, return empty - API calls can be added as backends are available
      return [];
    },
    enabled: showLinkModal && linkSearch.length > 0,
  });

  const linkMutation = useMutation({
    mutationFn: (data: { entityType: BimLinkedEntityType; entityId: string }) =>
      bimApi.linkItemToClash(clashId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bim-clash-linked-items', clashId] });
      toast.success(t('bim.linking.toastLinked'));
      setShowLinkModal(false);
      setLinkSearch('');
      setSelectedEntityId(null);
    },
  });

  const unlinkMutation = useMutation({
    mutationFn: (linkId: string) => bimApi.unlinkItemFromClash(clashId, linkId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bim-clash-linked-items', clashId] });
      toast.success(t('bim.linking.toastUnlinked'));
    },
  });

  const handleLink = () => {
    if (!selectedEntityId) return;
    linkMutation.mutate({ entityType: linkEntityType, entityId: selectedEntityId });
  };

  const handleCreateIssue = () => {
    toast(t('bim.linking.toastCreateIssueHint'));
    navigate(`/pm/issues/new?fromClash=${clashId}`);
  };

  const filteredResults = useMemo(() => {
    if (!searchResults) return [];
    // Filter out already linked items
    const linkedEntityIds = new Set(
      linkedItems.filter((li) => li.entityType === linkEntityType).map((li) => li.entityId),
    );
    return searchResults.filter((r) => !linkedEntityIds.has(r.id));
  }, [searchResults, linkedItems, linkEntityType]);

  return (
    <div className={cn('bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
          <Link2 size={16} className="text-primary-500" />
          {linkedItems.length > 0
            ? t('bim.linking.linkedItemsCount', { count: String(linkedItems.length) })
            : t('bim.linking.linkedItems')}
        </h3>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="xs"
            iconLeft={<AlertTriangle size={13} />}
            onClick={handleCreateIssue}
          >
            {t('bim.linking.createIssueFromClash')}
          </Button>
          <Button
            variant="secondary"
            size="xs"
            iconLeft={<Plus size={13} />}
            onClick={() => setShowLinkModal(true)}
          >
            {t('bim.linking.linkItem')}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-14 bg-neutral-100 dark:bg-neutral-800 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : linkedItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Link2 size={32} className="text-neutral-300 dark:text-neutral-600 mb-3" />
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
            {t('bim.linking.emptyState')}
          </p>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1 max-w-xs">
            {t('bim.linking.emptyStateDescription')}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {linkedItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-750 transition-colors group"
            >
              <div
                className="flex items-center gap-3 flex-1 cursor-pointer min-w-0"
                onClick={() => navigate(getEntityRoute(item.entityType, item.entityId))}
              >
                <div className="flex-shrink-0">
                  <StatusBadge
                    status={item.entityType}
                    colorMap={entityTypeColorMap}
                    label={getEntityTypeLabel(item.entityType)}
                    size="sm"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate group-hover:text-primary-600 transition-colors">
                    {item.entityTitle}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                      {item.entityStatus}
                    </span>
                    <span className="text-neutral-300 dark:text-neutral-600">|</span>
                    <span className="text-xs text-neutral-400 dark:text-neutral-500">
                      {t('bim.linking.linkedAt')} {formatRelativeTime(item.linkedAt)}
                    </span>
                  </div>
                </div>
                <ExternalLink size={14} className="text-neutral-400 dark:text-neutral-500 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <button
                onClick={() => unlinkMutation.mutate(item.id)}
                className="ml-2 p-1.5 text-neutral-400 hover:text-danger-600 dark:hover:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-md transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                title={t('bim.linking.unlinkItem')}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Link Item Modal */}
      <Modal
        open={showLinkModal}
        onClose={() => {
          setShowLinkModal(false);
          setLinkSearch('');
          setSelectedEntityId(null);
        }}
        title={t('bim.linking.linkModalTitle')}
        description={t('bim.linking.linkModalDescription')}
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setShowLinkModal(false);
                setLinkSearch('');
                setSelectedEntityId(null);
              }}
            >
              {t('bim.linking.cancelButton')}
            </Button>
            <Button
              size="sm"
              onClick={handleLink}
              disabled={!selectedEntityId}
              loading={linkMutation.isPending}
            >
              {t('bim.linking.linkButton')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            options={[
              { value: 'ISSUE', label: t('bim.linking.entityTypeIssue') },
              { value: 'RFI', label: t('bim.linking.entityTypeRfi') },
              { value: 'CHANGE_ORDER', label: t('bim.linking.entityTypeChangeOrder') },
              { value: 'DEFECT', label: t('bim.linking.entityTypeDefect') },
            ]}
            value={linkEntityType}
            onChange={(e) => {
              setLinkEntityType(e.target.value as BimLinkedEntityType);
              setSelectedEntityId(null);
            }}
          />

          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder={t('bim.linking.searchPlaceholder')}
              value={linkSearch}
              onChange={(e) => setLinkSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1 border border-neutral-200 dark:border-neutral-700 rounded-lg p-2">
            {isSearching ? (
              <div className="py-4 text-center text-sm text-neutral-400 dark:text-neutral-500">
                <div className="inline-block w-4 h-4 border-2 border-neutral-300 dark:border-neutral-600 border-t-primary-500 rounded-full animate-spin mr-2" />
              </div>
            ) : filteredResults.length === 0 ? (
              <div className="py-6 text-center text-sm text-neutral-400 dark:text-neutral-500">
                {linkSearch.length > 0 ? t('bim.linking.noResultsFound') : t('bim.linking.searchPlaceholder')}
              </div>
            ) : (
              filteredResults.map((entity) => (
                <button
                  key={entity.id}
                  type="button"
                  onClick={() => setSelectedEntityId(entity.id)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors',
                    selectedEntityId === entity.id
                      ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-700'
                      : 'hover:bg-neutral-50 dark:hover:bg-neutral-800 border border-transparent',
                  )}
                >
                  <span className="flex-shrink-0 text-neutral-400 dark:text-neutral-500">
                    {entityTypeIconMap[linkEntityType]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                      {entity.code ? `${entity.code}: ` : ''}{entity.title}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{entity.status}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LinkedItemsPanel;
