import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Package,
  Settings,
  Trash2,
  RefreshCw,
  Store,
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowUpCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { EmptyState } from '@/design-system/components/EmptyState';
import { Modal } from '@/design-system/components/Modal';
import { Skeleton } from '@/design-system/components/Skeleton';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { marketplaceApi, type MarketplacePlugin } from '@/api/marketplace';
import PluginConfigModal from './components/PluginConfigModal';

// ---------------------------------------------------------------------------
// Card skeleton
// ---------------------------------------------------------------------------

const InstalledCardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
    <div className="flex items-start gap-4">
      <Skeleton className="w-12 h-12 rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-3 w-36" />
      </div>
      <Skeleton className="h-8 w-20 rounded-lg" />
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

const MarketplaceInstalledPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [configPlugin, setConfigPlugin] = useState<MarketplacePlugin | null>(null);
  const [uninstallPlugin, setUninstallPlugin] = useState<MarketplacePlugin | null>(null);

  const { data: plugins, isLoading } = useQuery({
    queryKey: ['marketplace', 'installed'],
    queryFn: () => marketplaceApi.getInstalledPlugins(),
  });

  const uninstallMutation = useMutation({
    mutationFn: (id: string) => marketplaceApi.uninstallPlugin(id),
    onSuccess: () => {
      toast.success(t('marketplace.uninstallSuccess'));
      queryClient.invalidateQueries({ queryKey: ['marketplace'] });
      setUninstallPlugin(null);
    },
    onError: () => {
      toast.error(t('marketplace.uninstallError'));
    },
  });

  const handleCheckUpdates = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['marketplace'] });
    toast.success(t('marketplace.checkUpdates'));
  }, [queryClient]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('marketplace.installedTitle')}
        subtitle={t('marketplace.installedSubtitle')}
        breadcrumbs={[
          { label: t('marketplace.breadcrumbHome'), href: '/' },
          { label: t('marketplace.title'), href: '/marketplace' },
          { label: t('marketplace.installed') },
        ]}
        backTo="/marketplace"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<RefreshCw size={14} />}
              onClick={handleCheckUpdates}
            >
              {t('marketplace.checkUpdates')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              iconLeft={<Store size={14} />}
              onClick={() => navigate('/marketplace')}
            >
              {t('marketplace.catalog')}
            </Button>
          </div>
        }
      />

      {/* Plugin list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <InstalledCardSkeleton key={i} />
          ))}
        </div>
      ) : !plugins || plugins.length === 0 ? (
        <EmptyState
          icon={<Package size={40} strokeWidth={1.5} />}
          title={t('marketplace.noInstalledPlugins')}
          description={t('marketplace.noInstalledDescription')}
          actionLabel={t('marketplace.browseMarketplace')}
          onAction={() => navigate('/marketplace')}
        />
      ) : (
        <div className="space-y-3">
          {plugins.map((plugin) => {
            const hasUpdate = plugin.status === 'UPDATE_AVAILABLE';

            return (
              <div
                key={plugin.id}
                className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5 hover:shadow-sm transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Icon + info */}
                  <div
                    className="flex items-start gap-4 flex-1 min-w-0 cursor-pointer"
                    onClick={() => navigate(`/marketplace/${plugin.id}`)}
                  >
                    <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {plugin.iconUrl ? (
                        <img src={plugin.iconUrl} alt="" className="w-12 h-12 rounded-xl object-cover" />
                      ) : (
                        <Package size={24} className="text-neutral-400 dark:text-neutral-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 truncate">
                          {plugin.name}
                        </h3>
                        {hasUpdate && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400">
                            <ArrowUpCircle size={11} />
                            {t('marketplace.statusUpdateAvailable')}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                        {t('marketplace.version')}: {plugin.installedVersion ?? plugin.version}
                        {plugin.installedAt && (
                          <span className="ml-3">
                            {t('marketplace.installedAt')}: {new Date(plugin.installedAt).toLocaleDateString()}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-1">
                        {plugin.description}
                      </p>
                    </div>
                  </div>

                  {/* Status + Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0 sm:ml-auto">
                    <div
                      className={cn(
                        'flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full',
                        plugin.status !== 'DEPRECATED'
                          ? 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400',
                      )}
                    >
                      {plugin.status !== 'DEPRECATED' ? (
                        <CheckCircle2 size={12} />
                      ) : (
                        <XCircle size={12} />
                      )}
                      {plugin.status !== 'DEPRECATED' ? t('marketplace.enabled') : t('marketplace.disabled')}
                    </div>
                    <Button
                      variant="secondary"
                      size="xs"
                      iconLeft={<Settings size={13} />}
                      onClick={() => setConfigPlugin(plugin)}
                    >
                      {t('marketplace.configure')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      iconLeft={<Trash2 size={13} />}
                      onClick={() => setUninstallPlugin(plugin)}
                      className="text-danger-600 hover:text-danger-700 hover:bg-danger-50 dark:hover:bg-danger-900/20"
                    >
                      {t('marketplace.uninstall')}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Config modal */}
      {configPlugin && (
        <PluginConfigModal
          open={!!configPlugin}
          onClose={() => setConfigPlugin(null)}
          plugin={configPlugin}
        />
      )}

      {/* Confirm uninstall modal */}
      <Modal
        open={!!uninstallPlugin}
        onClose={() => setUninstallPlugin(null)}
        title={t('marketplace.confirmUninstallTitle')}
        description={t('marketplace.confirmUninstallDescription')}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setUninstallPlugin(null)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              onClick={() => uninstallPlugin && uninstallMutation.mutate(uninstallPlugin.id)}
              loading={uninstallMutation.isPending}
            >
              {t('marketplace.uninstall')}
            </Button>
          </>
        }
      />
    </div>
  );
};

export default MarketplaceInstalledPage;
