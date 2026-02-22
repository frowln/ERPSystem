import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Store,
  Search,
  Star,
  Download,
  Package,
  CheckCircle2,
  ArrowUpCircle,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { EmptyState } from '@/design-system/components/EmptyState';
import { Skeleton } from '@/design-system/components/Skeleton';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import {
  marketplaceApi,
  type PluginCategory,
  type PluginPrice,
  type MarketplacePlugin,
} from '@/api/marketplace';

// ---------------------------------------------------------------------------
// Category & price config
// ---------------------------------------------------------------------------

const CATEGORIES: Array<{ id: PluginCategory | 'ALL'; labelKey: string }> = [
  { id: 'ALL', labelKey: 'marketplace.categoryAll' },
  { id: 'ANALYTICS', labelKey: 'marketplace.categoryAnalytics' },
  { id: 'INTEGRATION', labelKey: 'marketplace.categoryIntegration' },
  { id: 'AUTOMATION', labelKey: 'marketplace.categoryAutomation' },
  { id: 'REPORTING', labelKey: 'marketplace.categoryReporting' },
  { id: 'COMMUNICATION', labelKey: 'marketplace.categoryCommunication' },
  { id: 'SAFETY', labelKey: 'marketplace.categorySafety' },
  { id: 'FINANCE', labelKey: 'marketplace.categoryFinance' },
];

const PRICES: Array<{ id: PluginPrice | 'ALL'; labelKey: string }> = [
  { id: 'ALL', labelKey: 'marketplace.priceAll' },
  { id: 'FREE', labelKey: 'marketplace.priceFree' },
  { id: 'PREMIUM', labelKey: 'marketplace.pricePremium' },
  { id: 'ENTERPRISE', labelKey: 'marketplace.priceEnterprise' },
];

const priceColorMap: Record<PluginPrice, string> = {
  FREE: 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400',
  PREMIUM: 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400',
  ENTERPRISE: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
};

// ---------------------------------------------------------------------------
// Star rating component
// ---------------------------------------------------------------------------

const StarRating: React.FC<{ rating: number; className?: string }> = ({ rating, className }) => (
  <div className={cn('flex items-center gap-0.5', className)}>
    {Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        size={12}
        className={cn(
          i < Math.round(rating)
            ? 'text-amber-400 fill-amber-400'
            : 'text-neutral-300 dark:text-neutral-600',
        )}
      />
    ))}
    <span className="ml-1 text-xs text-neutral-600 dark:text-neutral-400">{rating.toFixed(1)}</span>
  </div>
);

// ---------------------------------------------------------------------------
// Plugin card skeleton
// ---------------------------------------------------------------------------

const PluginCardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5 space-y-3">
    <div className="flex items-start gap-3">
      <Skeleton className="w-12 h-12 rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
    <Skeleton className="h-3 w-full" />
    <Skeleton className="h-3 w-3/4" />
    <div className="flex items-center justify-between pt-2">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-8 w-24 rounded-lg" />
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Plugin card
// ---------------------------------------------------------------------------

interface PluginCardProps {
  plugin: MarketplacePlugin;
  onInstall: (id: string) => void;
  installing: string | null;
  onClick: () => void;
}

const PluginCard: React.FC<PluginCardProps> = React.memo(({ plugin, onInstall, installing, onClick }) => {
  const isInstalling = installing === plugin.id;
  const isInstalled = plugin.status === 'INSTALLED' || plugin.status === 'UPDATE_AVAILABLE';

  return (
    <div
      className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5 hover:shadow-md dark:hover:border-neutral-600 transition-all cursor-pointer flex flex-col"
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {plugin.iconUrl ? (
            <img src={plugin.iconUrl} alt="" className="w-12 h-12 rounded-xl object-cover" />
          ) : (
            <Package size={24} className="text-neutral-400 dark:text-neutral-500" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 truncate">
            {plugin.name}
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
            {plugin.developer}
          </p>
        </div>
        <span
          className={cn(
            'px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0',
            priceColorMap[plugin.price],
          )}
        >
          {t(`marketplace.price${plugin.price.charAt(0)}${plugin.price.slice(1).toLowerCase()}` as 'marketplace.priceFree')}
        </span>
      </div>

      {/* Description */}
      <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2 mb-3 flex-1">
        {plugin.description}
      </p>

      {/* Rating & installs */}
      <div className="flex items-center gap-3 mb-3">
        <StarRating rating={plugin.rating} />
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          <Download size={11} className="inline mr-0.5 -mt-0.5" />
          {plugin.installCount.toLocaleString()} {t('marketplace.installs')}
        </span>
      </div>

      {/* Action */}
      <div className="mt-auto pt-3 border-t border-neutral-100 dark:border-neutral-800" onClick={(e) => e.stopPropagation()}>
        {plugin.status === 'AVAILABLE' && (
          <Button
            variant="primary"
            size="sm"
            fullWidth
            iconLeft={isInstalling ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            onClick={() => onInstall(plugin.id)}
            disabled={isInstalling}
          >
            {isInstalling ? t('marketplace.installing') : t('marketplace.install')}
          </Button>
        )}
        {plugin.status === 'INSTALLED' && (
          <Button
            variant="secondary"
            size="sm"
            fullWidth
            iconLeft={<CheckCircle2 size={14} className="text-success-600" />}
            disabled
          >
            {t('marketplace.statusInstalled')}
          </Button>
        )}
        {plugin.status === 'UPDATE_AVAILABLE' && (
          <Button
            variant="primary"
            size="sm"
            fullWidth
            iconLeft={isInstalling ? <Loader2 size={14} className="animate-spin" /> : <ArrowUpCircle size={14} />}
            onClick={() => onInstall(plugin.id)}
            disabled={isInstalling}
          >
            {isInstalling ? t('marketplace.installing') : t('marketplace.update')}
          </Button>
        )}
        {plugin.status === 'DEPRECATED' && (
          <Button variant="secondary" size="sm" fullWidth disabled>
            {t('marketplace.statusDeprecated')}
          </Button>
        )}
      </div>
    </div>
  );
});

PluginCard.displayName = 'PluginCard';

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

const MarketplaceListPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PluginCategory | 'ALL'>('ALL');
  const [selectedPrice, setSelectedPrice] = useState<PluginPrice | 'ALL'>('ALL');
  const [installingId, setInstallingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['marketplace', 'plugins', selectedCategory, selectedPrice, search],
    queryFn: () =>
      marketplaceApi.getPlugins({
        category: selectedCategory === 'ALL' ? undefined : selectedCategory,
        price: selectedPrice === 'ALL' ? undefined : selectedPrice,
        search: search || undefined,
      }),
  });

  const installMutation = useMutation({
    mutationFn: (id: string) => marketplaceApi.installPlugin(id),
    onMutate: (id) => setInstallingId(id),
    onSuccess: () => {
      toast.success(t('marketplace.installSuccess'));
      queryClient.invalidateQueries({ queryKey: ['marketplace'] });
    },
    onError: () => {
      toast.error(t('marketplace.installError'));
    },
    onSettled: () => setInstallingId(null),
  });

  const handleInstall = useCallback(
    (id: string) => {
      installMutation.mutate(id);
    },
    [installMutation],
  );

  const plugins = data?.content ?? [];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('marketplace.title')}
        subtitle={t('marketplace.subtitle')}
        breadcrumbs={[
          { label: t('marketplace.breadcrumbHome'), href: '/' },
          { label: t('marketplace.title') },
        ]}
        actions={
          <Button
            variant="secondary"
            size="sm"
            iconLeft={<Package size={14} />}
            onClick={() => navigate('/marketplace/installed')}
          >
            {t('marketplace.installed')}
          </Button>
        }
      />

      {/* Search bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('marketplace.search')}
            className={cn(
              'w-full h-11 md:h-9 pl-9 pr-3 text-sm bg-white dark:bg-neutral-800 dark:text-neutral-100',
              'border border-neutral-300 dark:border-neutral-600 rounded-lg',
              'placeholder:text-neutral-400 dark:placeholder:text-neutral-500',
              'focus:outline-none focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900 focus:border-primary-500',
              'transition-colors duration-150',
            )}
          />
        </div>
      </div>

      {/* Category tabs */}
      <div className="mb-4 -mx-1 overflow-x-auto">
        <div className="flex items-center gap-1 px-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors',
                selectedCategory === cat.id
                  ? 'bg-primary-600 text-white'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800',
              )}
            >
              {t(cat.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {/* Price filter */}
      <div className="mb-6 flex items-center gap-2">
        {PRICES.map((price) => (
          <button
            key={price.id}
            type="button"
            onClick={() => setSelectedPrice(price.id)}
            className={cn(
              'px-2.5 py-1 text-xs font-medium rounded-full border transition-colors',
              selectedPrice === price.id
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800',
            )}
          >
            {t(price.labelKey)}
          </button>
        ))}
      </div>

      {/* Plugin grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <PluginCardSkeleton key={i} />
          ))}
        </div>
      ) : plugins.length === 0 ? (
        <EmptyState
          icon={<Store size={40} strokeWidth={1.5} />}
          title={t('marketplace.noPluginsFound')}
          description={t('marketplace.noPluginsDescription')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {plugins.map((plugin) => (
            <PluginCard
              key={plugin.id}
              plugin={plugin}
              onInstall={handleInstall}
              installing={installingId}
              onClick={() => navigate(`/marketplace/${plugin.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MarketplaceListPage;
