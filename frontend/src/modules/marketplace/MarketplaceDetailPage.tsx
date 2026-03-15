import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Package,
  Star,
  Download,
  Settings,
  Trash2,
  ArrowUpCircle,
  ExternalLink,
  Shield,
  Tag,
  ChevronLeft,
  ChevronRight,
  Loader2,
  User,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { Modal } from '@/design-system/components/Modal';
import { PageSkeleton } from '@/design-system/components/Skeleton';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { formatDate } from '@/lib/format';
import { marketplaceApi, type MarketplacePlugin, type MarketplaceReview } from '@/api/marketplace';
const PluginConfigModal = React.lazy(() => import('./components/PluginConfigModal'));

// ---------------------------------------------------------------------------
// Star rating component
// ---------------------------------------------------------------------------

const StarRating: React.FC<{ rating: number; size?: number }> = ({ rating, size = 14 }) => (
  <div className="flex items-center gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        size={size}
        className={cn(
          i < Math.round(rating)
            ? 'text-amber-400 fill-amber-400'
            : 'text-neutral-300 dark:text-neutral-600',
        )}
      />
    ))}
  </div>
);

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

type DetailTab = 'overview' | 'screenshots' | 'reviews' | 'changelog';

const TAB_KEYS: Array<{ id: DetailTab; labelKey: string }> = [
  { id: 'overview', labelKey: 'marketplace.overview' },
  { id: 'screenshots', labelKey: 'marketplace.screenshots' },
  { id: 'reviews', labelKey: 'marketplace.reviews' },
  { id: 'changelog', labelKey: 'marketplace.changelog' },
];

// ---------------------------------------------------------------------------
// Price badge
// ---------------------------------------------------------------------------

const priceBadgeColor: Record<string, string> = {
  FREE: 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400',
  PREMIUM: 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400',
  ENTERPRISE: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
};

// ---------------------------------------------------------------------------
// Screenshot gallery
// ---------------------------------------------------------------------------

const ScreenshotGallery: React.FC<{ urls: string[] }> = ({ urls }) => {
  const [currentIdx, setCurrentIdx] = useState(0);

  if (urls.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-neutral-500 dark:text-neutral-400 text-sm">
        {t('marketplace.noScreenshots')}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-video bg-neutral-100 dark:bg-neutral-800 rounded-xl overflow-hidden">
        <img
          src={urls[currentIdx]}
          alt={`Screenshot ${currentIdx + 1}`}
          className="w-full h-full object-contain"
        />
        {urls.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => setCurrentIdx((prev) => (prev - 1 + urls.length) % urls.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 dark:bg-neutral-800/80 flex items-center justify-center text-neutral-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-700 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => setCurrentIdx((prev) => (prev + 1) % urls.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 dark:bg-neutral-800/80 flex items-center justify-center text-neutral-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-700 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}
      </div>
      {urls.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {urls.map((url, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIdx(idx)}
              className={cn(
                'w-20 h-14 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors',
                idx === currentIdx
                  ? 'border-primary-500'
                  : 'border-transparent hover:border-neutral-300 dark:hover:border-neutral-600',
              )}
            >
              <img src={url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Review item
// ---------------------------------------------------------------------------

const ReviewItem: React.FC<{ review: MarketplaceReview }> = ({ review }) => (
  <div className="py-4 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
    <div className="flex items-center gap-3 mb-2">
      <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
        <User size={14} className="text-neutral-500 dark:text-neutral-400" />
      </div>
      <div>
        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{review.userName}</p>
        <div className="flex items-center gap-2">
          <StarRating rating={review.rating} size={11} />
          <span className="text-xs text-neutral-400">
            {formatDate(review.createdAt)}
          </span>
        </div>
      </div>
    </div>
    <p className="text-sm text-neutral-600 dark:text-neutral-400 pl-11">{review.comment}</p>
  </div>
);

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

const MarketplaceDetailPage: React.FC = () => {
  const { pluginId } = useParams<{ pluginId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [configOpen, setConfigOpen] = useState(false);
  const [confirmUninstall, setConfirmUninstall] = useState(false);

  const { data: plugin, isLoading } = useQuery({
    queryKey: ['marketplace', 'plugin', pluginId],
    queryFn: () => marketplaceApi.getPlugin(pluginId!),
    enabled: !!pluginId,
  });

  const { data: reviews } = useQuery({
    queryKey: ['marketplace', 'reviews', pluginId],
    queryFn: () => marketplaceApi.getPluginReviews(pluginId!),
    enabled: !!pluginId && activeTab === 'reviews',
  });

  const installMutation = useMutation({
    mutationFn: () => marketplaceApi.installPlugin(pluginId!),
    onSuccess: () => {
      toast.success(t('marketplace.installSuccess'));
      queryClient.invalidateQueries({ queryKey: ['marketplace'] });
    },
    onError: () => {
      toast.error(t('marketplace.installError'));
    },
  });

  const uninstallMutation = useMutation({
    mutationFn: () => marketplaceApi.uninstallPlugin(pluginId!),
    onSuccess: () => {
      toast.success(t('marketplace.uninstallSuccess'));
      queryClient.invalidateQueries({ queryKey: ['marketplace'] });
      setConfirmUninstall(false);
    },
    onError: () => {
      toast.error(t('marketplace.uninstallError'));
    },
  });

  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId as DetailTab);
  }, []);

  if (isLoading || !plugin) {
    return (
      <div className="animate-fade-in">
        <PageSkeleton variant="detail" />
      </div>
    );
  }

  const isInstalled = plugin.status === 'INSTALLED' || plugin.status === 'UPDATE_AVAILABLE';

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={plugin.name}
        breadcrumbs={[
          { label: t('marketplace.breadcrumbHome'), href: '/' },
          { label: t('marketplace.title'), href: '/marketplace' },
          { label: plugin.name },
        ]}
        backTo="/marketplace"
      />

      {/* Hero section */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Icon */}
          <div className="w-20 h-20 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {plugin.iconUrl ? (
              <img src={plugin.iconUrl} alt="" className="w-20 h-20 rounded-2xl object-cover" />
            ) : (
              <Package size={36} className="text-neutral-400 dark:text-neutral-500" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                  {plugin.name}
                </h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {t('marketplace.developer')}: {plugin.developer}
                  {plugin.developerUrl && (
                    <a
                      href={plugin.developerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center ml-1 text-primary-600 hover:text-primary-700"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink size={12} />
                    </a>
                  )}
                </p>
              </div>
              <span
                className={cn(
                  'px-3 py-1 text-sm font-medium rounded-full',
                  priceBadgeColor[plugin.price] ?? 'bg-neutral-100 text-neutral-700',
                )}
              >
                {t(`marketplace.price${plugin.price.charAt(0)}${plugin.price.slice(1).toLowerCase()}` as 'marketplace.priceFree')}
              </span>
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap items-center gap-4 mt-3">
              <div className="flex items-center gap-1">
                <StarRating rating={plugin.rating} />
                <span className="text-sm text-neutral-600 dark:text-neutral-400 ml-1">
                  ({plugin.reviewCount} {t('marketplace.reviews')})
                </span>
              </div>
              <div className="flex items-center gap-1 text-sm text-neutral-600 dark:text-neutral-400">
                <Download size={14} />
                {plugin.installCount.toLocaleString()} {t('marketplace.installs')}
              </div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">
                {t('marketplace.version')}: {plugin.version}
              </div>
            </div>

            {/* Installed info */}
            {isInstalled && plugin.installedVersion && (
              <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                {t('marketplace.installedVersion')}: {plugin.installedVersion}
                {plugin.installedAt && (
                  <span className="ml-3">
                    {t('marketplace.installedAt')}: {formatDate(plugin.installedAt)}
                  </span>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2 mt-4">
              {plugin.status === 'AVAILABLE' && (
                <Button
                  variant="primary"
                  size="sm"
                  iconLeft={installMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                  onClick={() => installMutation.mutate()}
                  disabled={installMutation.isPending}
                >
                  {installMutation.isPending ? t('marketplace.installing') : t('marketplace.install')}
                </Button>
              )}
              {plugin.status === 'UPDATE_AVAILABLE' && (
                <Button
                  variant="primary"
                  size="sm"
                  iconLeft={installMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <ArrowUpCircle size={14} />}
                  onClick={() => installMutation.mutate()}
                  disabled={installMutation.isPending}
                >
                  {installMutation.isPending ? t('marketplace.installing') : t('marketplace.update')}
                </Button>
              )}
              {isInstalled && (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    iconLeft={<Settings size={14} />}
                    onClick={() => setConfigOpen(true)}
                  >
                    {t('marketplace.configure')}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    iconLeft={<Trash2 size={14} />}
                    onClick={() => setConfirmUninstall(true)}
                  >
                    {t('marketplace.uninstall')}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 -mx-1 overflow-x-auto">
        <div className="flex items-center gap-0 border-b border-neutral-200 dark:border-neutral-700 px-1">
          {TAB_KEYS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                'relative px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap',
                'hover:text-neutral-700 dark:hover:text-neutral-300',
                activeTab === tab.id
                  ? 'text-primary-600 dark:text-primary-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary-600 dark:after:bg-primary-400 after:rounded-t'
                  : 'text-neutral-500 dark:text-neutral-400',
              )}
            >
              {t(tab.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
        {/* Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="text-neutral-700 dark:text-neutral-300 whitespace-pre-line">
                {plugin.longDescription}
              </p>
            </div>

            {/* Permissions */}
            {plugin.permissions.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3 flex items-center gap-2">
                  <Shield size={16} />
                  {t('marketplace.permissions')}
                </h3>
                <ul className="space-y-1.5">
                  {plugin.permissions.map((perm, idx) => (
                    <li
                      key={idx}
                      className="text-sm text-neutral-600 dark:text-neutral-400 flex items-center gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-neutral-600 flex-shrink-0" />
                      {perm}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tags */}
            {plugin.tags.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3 flex items-center gap-2">
                  <Tag size={16} />
                  {t('marketplace.tags')}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {plugin.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Screenshots */}
        {activeTab === 'screenshots' && (
          <ScreenshotGallery urls={plugin.screenshotUrls} />
        )}

        {/* Reviews */}
        {activeTab === 'reviews' && (
          <div>
            {!reviews || reviews.length === 0 ? (
              <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-8">
                {t('marketplace.noReviews')}
              </p>
            ) : (
              <div>
                {reviews.map((review) => (
                  <ReviewItem key={review.id} review={review} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Changelog */}
        {activeTab === 'changelog' && (
          <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-8">
            {t('marketplace.noChangelog')}
          </p>
        )}
      </div>

      {/* Config modal */}
      {isInstalled && configOpen && (
        <React.Suspense fallback={null}>
          <PluginConfigModal
            open={configOpen}
            onClose={() => setConfigOpen(false)}
            plugin={plugin}
          />
        </React.Suspense>
      )}

      {/* Confirm uninstall modal */}
      <Modal
        open={confirmUninstall}
        onClose={() => setConfirmUninstall(false)}
        title={t('marketplace.confirmUninstallTitle')}
        description={t('marketplace.confirmUninstallDescription')}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmUninstall(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              onClick={() => uninstallMutation.mutate()}
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

export default MarketplaceDetailPage;
