import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Plus,
  X,
  Search,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/design-system/components/Button';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Modal } from '@/design-system/components/Modal';
import { Input } from '@/design-system/components/FormField';
import { bimApi, type Clash, type BimLinkedEntityType, type ClashSeverity } from '@/api/bim';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import toast from 'react-hot-toast';

interface BimLinkedClashesPanelProps {
  entityType: BimLinkedEntityType;
  entityId: string;
  className?: string;
}

const severityColorMap: Record<string, 'red' | 'orange' | 'yellow' | 'gray'> = {
  CRITICAL: 'red',
  MAJOR: 'orange',
  MINOR: 'yellow',
  INFO: 'gray',
};

const getSeverityLabel = (severity: ClashSeverity): string => {
  const labels: Record<ClashSeverity, string> = {
    CRITICAL: t('bim.severityCritical'),
    MAJOR: t('bim.severityMajor'),
    MINOR: t('bim.severityMinor'),
    INFO: t('bim.severityInfo'),
  };
  return labels[severity];
};

const clashStatusColorMap: Record<string, 'red' | 'yellow' | 'green' | 'blue' | 'gray'> = {
  NEW: 'red',
  IN_PROGRESS: 'yellow',
  RESOLVED: 'green',
  APPROVED: 'blue',
  IGNORED: 'gray',
};

const getClashStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    NEW: t('bim.clashStatusNew'),
    IN_PROGRESS: t('bim.clashStatusInProgress'),
    RESOLVED: t('bim.clashStatusResolved'),
    APPROVED: t('bim.clashStatusApproved'),
    IGNORED: t('bim.clashStatusIgnored'),
  };
  return labels[status] ?? status;
};

const BimLinkedClashesPanel: React.FC<BimLinkedClashesPanelProps> = ({
  entityType,
  entityId,
  className,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [clashSearch, setClashSearch] = useState('');
  const [selectedClashId, setSelectedClashId] = useState<string | null>(null);

  const { data: linkedClashes = [], isLoading } = useQuery({
    queryKey: ['bim-linked-clashes', entityType, entityId],
    queryFn: () => bimApi.getLinkedClashes(entityType, entityId),
    enabled: !!entityId,
  });

  // Search for clashes to link
  const { data: clashSearchResults, isLoading: isSearching } = useQuery({
    queryKey: ['bim-clash-search', clashSearch],
    queryFn: async () => {
      const result = await bimApi.getClashes({ search: clashSearch, size: 10 });
      return result.content;
    },
    enabled: showLinkModal && clashSearch.length > 0,
  });

  const linkMutation = useMutation({
    mutationFn: (clashId: string) =>
      bimApi.linkItemToClash(clashId, { entityType, entityId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bim-linked-clashes', entityType, entityId] });
      toast.success(t('bim.linking.toastLinked'));
      setShowLinkModal(false);
      setClashSearch('');
      setSelectedClashId(null);
    },
  });

  const unlinkMutation = useMutation({
    mutationFn: (params: { clashId: string; linkId: string }) =>
      bimApi.unlinkItemFromClash(params.clashId, params.linkId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bim-linked-clashes', entityType, entityId] });
      toast.success(t('bim.linking.toastUnlinked'));
    },
  });

  const filteredClashResults = useMemo(() => {
    if (!clashSearchResults) return [];
    const linkedClashIds = new Set(linkedClashes.map((c) => c.id));
    return clashSearchResults.filter((c) => !linkedClashIds.has(c.id));
  }, [clashSearchResults, linkedClashes]);

  const handleLink = () => {
    if (!selectedClashId) return;
    linkMutation.mutate(selectedClashId);
  };

  return (
    <div className={cn('bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5', className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
          <Box size={15} className="text-primary-500" />
          {linkedClashes.length > 0
            ? t('bim.linking.linkedClashesCount', { count: String(linkedClashes.length) })
            : t('bim.linking.linkedClashes')}
        </h3>
        <Button
          variant="ghost"
          size="xs"
          iconLeft={<Plus size={13} />}
          onClick={() => setShowLinkModal(true)}
        >
          {t('bim.linking.linkClash')}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-12 bg-neutral-100 dark:bg-neutral-800 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : linkedClashes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <Box size={28} className="text-neutral-300 dark:text-neutral-600 mb-2" />
          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
            {t('bim.linking.noLinkedClashes')}
          </p>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5 max-w-[200px]">
            {t('bim.linking.noLinkedClashesDescription')}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {linkedClashes.map((clash) => (
            <div
              key={clash.id}
              className="flex items-center justify-between p-2.5 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-750 transition-colors group cursor-pointer"
              onClick={() => navigate('/bim/clash-detection')}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400 flex-shrink-0">
                  {clash.code}
                </span>
                <StatusBadge
                  status={clash.severity}
                  colorMap={severityColorMap}
                  label={getSeverityLabel(clash.severity)}
                  size="sm"
                />
                <StatusBadge
                  status={clash.status}
                  colorMap={clashStatusColorMap}
                  label={getClashStatusLabel(clash.status)}
                  size="sm"
                />
                <ExternalLink size={12} className="text-neutral-400 dark:text-neutral-500 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  unlinkMutation.mutate({ clashId: clash.id, linkId: clash.linkId });
                }}
                className="ml-2 p-1 text-neutral-400 hover:text-danger-600 dark:hover:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                title={t('bim.linking.unlinkItem')}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Link Clash Modal */}
      <Modal
        open={showLinkModal}
        onClose={() => {
          setShowLinkModal(false);
          setClashSearch('');
          setSelectedClashId(null);
        }}
        title={t('bim.linking.linkClash')}
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setShowLinkModal(false);
                setClashSearch('');
                setSelectedClashId(null);
              }}
            >
              {t('bim.linking.cancelButton')}
            </Button>
            <Button
              size="sm"
              onClick={handleLink}
              disabled={!selectedClashId}
              loading={linkMutation.isPending}
            >
              {t('bim.linking.linkButton')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder={t('bim.searchClashPlaceholder')}
              value={clashSearch}
              onChange={(e) => setClashSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1 border border-neutral-200 dark:border-neutral-700 rounded-lg p-2">
            {isSearching ? (
              <div className="py-4 text-center text-sm text-neutral-400 dark:text-neutral-500">
                <div className="inline-block w-4 h-4 border-2 border-neutral-300 dark:border-neutral-600 border-t-primary-500 rounded-full animate-spin mr-2" />
              </div>
            ) : filteredClashResults.length === 0 ? (
              <div className="py-6 text-center text-sm text-neutral-400 dark:text-neutral-500">
                {clashSearch.length > 0 ? t('bim.linking.noResultsFound') : t('bim.searchClashPlaceholder')}
              </div>
            ) : (
              filteredClashResults.map((clash) => (
                <button
                  key={clash.id}
                  type="button"
                  onClick={() => setSelectedClashId(clash.id)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors',
                    selectedClashId === clash.id
                      ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-700'
                      : 'hover:bg-neutral-50 dark:hover:bg-neutral-800 border border-transparent',
                  )}
                >
                  <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400 flex-shrink-0">
                    {clash.code}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                      {clash.description}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <StatusBadge
                        status={clash.severity}
                        colorMap={severityColorMap}
                        label={getSeverityLabel(clash.severity)}
                        size="sm"
                      />
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">
                        {clash.location}
                      </span>
                    </div>
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

export default BimLinkedClashesPanel;
