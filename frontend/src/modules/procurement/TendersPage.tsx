import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Gavel, Package, HardHat, Search, ExternalLink, Trophy, BarChart3 } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { procurementApi } from '@/api/procurement';
import { bidScoringApi } from '@/api/bidScoring';
import { projectsApi } from '@/api/projects';
import { formatDate, formatMoney } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
const TenderEvaluateWizard = React.lazy(() => import('./TenderEvaluateWizard'));
import type { PurchaseRequest } from '@/types';

// ─── Category mapping ────────────────────────────────────────────────────────

const MATERIALS_STATUSES = ['DRAFT', 'SUBMITTED', 'IN_APPROVAL', 'APPROVED', 'ASSIGNED', 'ORDERED', 'DELIVERED', 'CLOSED', 'CANCELLED'] as const;

// A "materials" request is identified by items containing unit-priced goods
// A "works" request is identified by service/work items
// Since the backend doesn't have a category field, we use the notes field tag:
// tag: 'MATERIALS' | 'WORKS'
// We'll read the `notes` field for a `tenderType` hint, defaulting to 'MATERIALS'

function getTenderType(req: PurchaseRequest): 'MATERIALS' | 'WORKS' {
  if (!req.notes) return 'MATERIALS';
  try {
    const meta = JSON.parse(req.notes);
    if (meta.tenderType === 'WORKS') return 'WORKS';
  } catch {
    // notes may be plain text
    if (req.notes.toLowerCase().includes('работ') || req.notes.toLowerCase().includes('субподряд')) return 'WORKS';
  }
  return 'MATERIALS';
}

const getStatusLabels = (): Record<string, string> => ({
  DRAFT: t('procurement.tenders.statusDraft'),
  SUBMITTED: t('procurement.tenders.statusSubmitted'),
  IN_APPROVAL: t('procurement.tenders.statusInApproval'),
  APPROVED: t('procurement.tenders.statusApproved'),
  ASSIGNED: t('procurement.tenders.statusAssigned'),
  ORDERED: t('procurement.tenders.statusOrdered'),
  DELIVERED: t('procurement.tenders.statusDelivered'),
  CLOSED: t('procurement.tenders.statusClosed'),
  CANCELLED: t('procurement.tenders.statusCancelled'),
});

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-neutral-100 text-neutral-600',
  SUBMITTED: 'bg-blue-50 text-blue-700',
  IN_APPROVAL: 'bg-yellow-50 text-yellow-700',
  APPROVED: 'bg-green-50 text-green-700',
  ASSIGNED: 'bg-purple-50 text-purple-700',
  ORDERED: 'bg-indigo-50 text-indigo-700',
  DELIVERED: 'bg-teal-50 text-teal-700',
  CLOSED: 'bg-neutral-200 text-neutral-700',
  CANCELLED: 'bg-red-50 text-red-700',
};

const getPriorityLabels = (): Record<string, string> => ({
  LOW: t('procurement.tenders.priorityLow'),
  MEDIUM: t('procurement.tenders.priorityMedium'),
  HIGH: t('procurement.tenders.priorityHigh'),
  CRITICAL: t('procurement.tenders.priorityCritical'),
});

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'text-neutral-500',
  MEDIUM: 'text-blue-600',
  HIGH: 'text-orange-600',
  CRITICAL: 'text-red-600 font-bold',
};

// ─── Tender Card ─────────────────────────────────────────────────────────────

const TenderCard: React.FC<{
  request: PurchaseRequest;
  onEvaluate: (r: PurchaseRequest) => void;
}> = ({ request: r, onEvaluate }) => {
  const navigate = useNavigate();
  const totalAmount = r.totalAmount ?? r.items?.reduce((s, i) => s + (i.amount ?? 0), 0) ?? 0;
  const itemCount = r.items?.length ?? r.itemCount ?? 0;
  const hasWinner = ['ASSIGNED', 'ORDERED', 'DELIVERED', 'CLOSED'].includes(r.status);
  const statusLabels = getStatusLabels();
  const priorityLabels = getPriorityLabels();

  return (
    <div
      className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => navigate(`/procurement/${r.id}`)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 truncate">{r.name}</p>
          {r.projectName && (
            <p className="text-xs text-neutral-400 mt-0.5 truncate">{r.projectName}</p>
          )}
        </div>
        <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium shrink-0', STATUS_COLORS[r.status] ?? 'bg-neutral-100 text-neutral-600')}>
          {statusLabels[r.status] ?? r.status}
        </span>
      </div>

      {/* Details */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <p className="text-neutral-400">{t('procurement.tenders.cardPositions')}</p>
          <p className="font-medium text-neutral-700 dark:text-neutral-300">{itemCount > 0 ? itemCount : '—'}</p>
        </div>
        <div>
          <p className="text-neutral-400">{t('procurement.tenders.cardAmount')}</p>
          <p className="font-medium text-neutral-700 dark:text-neutral-300">
            {totalAmount > 0 ? formatMoney(totalAmount) : '—'}
          </p>
        </div>
        <div>
          <p className="text-neutral-400">{t('procurement.tenders.cardPriority')}</p>
          <p className={cn('font-medium', PRIORITY_COLORS[r.priority ?? ''] ?? 'text-neutral-600')}>
            {priorityLabels[r.priority ?? ''] ?? r.priority ?? '—'}
          </p>
        </div>
      </div>

      {r.requestDate && (
        <p className="text-xs text-neutral-400">{t('procurement.tenders.cardRequestDate')}: {formatDate(r.requestDate)}</p>
      )}

      {/* Winner badge */}
      {hasWinner && r.assignedToName && (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <Trophy size={12} className="text-green-600 shrink-0" />
          <p className="text-xs text-green-700 dark:text-green-400 font-medium truncate">
            {t('procurement.tenders.cardExecutor')}: {r.assignedToName}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-neutral-100 dark:border-neutral-700">
        <Button
          variant="ghost"
          size="sm"
          iconRight={<ExternalLink size={12} />}
          onClick={(e) => { e.stopPropagation(); navigate(`/procurement/${r.id}`); }}
        >
          {t('common.open')}
        </Button>
        {!hasWinner && r.status !== 'CANCELLED' && (
          <Button
            variant="secondary"
            size="sm"
            iconLeft={<Gavel size={12} />}
            onClick={(e) => { e.stopPropagation(); onEvaluate(r); }}
          >
            {t('procurement.tenders.evaluate')}
          </Button>
        )}
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const TendersPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'MATERIALS' | 'WORKS'>('MATERIALS');
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [evaluateRequest, setEvaluateRequest] = useState<PurchaseRequest | null>(null);

  const { data: requestsPage, isLoading } = useQuery({
    queryKey: ['tenders-all', projectFilter, statusFilter],
    queryFn: () => procurementApi.getPurchaseRequests({
      size: 100,
      projectId: projectFilter || undefined,
      status: (statusFilter as PurchaseRequest['status']) || undefined,
      sort: 'requestDate,desc',
    }),
  });

  const { data: projectsPage } = useQuery({
    queryKey: ['projects-for-tenders'],
    queryFn: () => projectsApi.getProjects({ size: 100, status: 'IN_PROGRESS' }),
    staleTime: 5 * 60_000,
  });

  const { data: comparisonsPage } = useQuery({
    queryKey: ['bid-comparisons-list'],
    queryFn: () => bidScoringApi.getComparisons({ size: 50, sort: 'createdAt,desc' }),
    staleTime: 2 * 60_000,
  });

  const allRequests = requestsPage?.content ?? [];
  const projects = projectsPage?.content ?? [];
  const bidComparisons = comparisonsPage?.content ?? [];

  // Split by tender type
  const { materialsRequests, worksRequests } = useMemo(() => {
    const filtered = search
      ? allRequests.filter((r) =>
          (r.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
          (r.projectName ?? '').toLowerCase().includes(search.toLowerCase()),
        )
      : allRequests;

    return {
      materialsRequests: filtered.filter((r) => getTenderType(r) !== 'WORKS'),
      worksRequests: filtered.filter((r) => getTenderType(r) === 'WORKS'),
    };
  }, [allRequests, search]);

  const displayedRequests = activeTab === 'MATERIALS' ? materialsRequests : worksRequests;

  const projectOptions = [
    { value: '', label: t('procurement.tenders.allProjects') },
    ...projects.map((p) => ({ value: p.id, label: p.name })),
  ];

  const statusLabels = getStatusLabels();

  const statusOptions = [
    { value: '', label: t('procurement.tenders.allStatuses') },
    { value: 'DRAFT', label: statusLabels['DRAFT'] },
    { value: 'SUBMITTED', label: statusLabels['SUBMITTED'] },
    { value: 'IN_APPROVAL', label: statusLabels['IN_APPROVAL'] },
    { value: 'APPROVED', label: statusLabels['APPROVED'] },
    { value: 'ASSIGNED', label: statusLabels['ASSIGNED'] },
    { value: 'ORDERED', label: statusLabels['ORDERED'] },
    { value: 'DELIVERED', label: statusLabels['DELIVERED'] },
    { value: 'CLOSED', label: statusLabels['CLOSED'] },
  ];

  // Stats per tab
  const materialsStats = {
    total: materialsRequests.length,
    open: materialsRequests.filter((r) => ['DRAFT', 'SUBMITTED', 'IN_APPROVAL', 'APPROVED'].includes(r.status)).length,
    awarded: materialsRequests.filter((r) => ['ASSIGNED', 'ORDERED', 'DELIVERED', 'CLOSED'].includes(r.status)).length,
  };
  const worksStats = {
    total: worksRequests.length,
    open: worksRequests.filter((r) => ['DRAFT', 'SUBMITTED', 'IN_APPROVAL', 'APPROVED'].includes(r.status)).length,
    awarded: worksRequests.filter((r) => ['ASSIGNED', 'ORDERED', 'DELIVERED', 'CLOSED'].includes(r.status)).length,
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('procurement.tenders.title')}
        subtitle={t('procurement.tenders.subtitle')}
        breadcrumbs={[
          { label: t('forms.common.home'), href: '/' },
          { label: t('procurement.tenders.title') },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<Package size={14} />}
              onClick={() => navigate('/procurement/new')}
            >
              {t('procurement.tenders.newMaterials')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              iconLeft={<HardHat size={14} />}
              onClick={() => navigate('/procurement/new')}
            >
              {t('procurement.tenders.newWorks')}
            </Button>
          </div>
        }
        tabs={[
          {
            id: 'MATERIALS',
            label: t('procurement.tenders.tabMaterials'),
            count: materialsStats.total,
          },
          {
            id: 'WORKS',
            label: t('procurement.tenders.tabWorks'),
            count: worksStats.total,
          },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as 'MATERIALS' | 'WORKS')}
      />

      <div className="p-6 space-y-5">
        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: t('procurement.tenders.statTotal'), value: (activeTab === 'MATERIALS' ? materialsStats : worksStats).total, color: 'text-neutral-800 dark:text-neutral-100' },
            { label: t('procurement.tenders.statOpen'), value: (activeTab === 'MATERIALS' ? materialsStats : worksStats).open, color: 'text-blue-700' },
            { label: t('procurement.tenders.statAwarded'), value: (activeTab === 'MATERIALS' ? materialsStats : worksStats).awarded, color: 'text-green-700' },
          ].map((s) => (
            <div key={s.label} className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{s.label}</p>
              <p className={cn('text-2xl font-bold mt-1', s.color)}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48 max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
            <Input
              placeholder={t('procurement.tenders.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            options={projectOptions}
            className="w-48"
          />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={statusOptions}
            className="w-44"
          />
        </div>

        {/* Tab description */}
        <div className="flex items-center gap-2 text-sm text-neutral-500">
          {activeTab === 'MATERIALS' ? (
            <>
              <Package size={15} className="text-blue-500" />
              <span>{t('procurement.tenders.descMaterials')}</span>
            </>
          ) : (
            <>
              <HardHat size={15} className="text-orange-500" />
              <span>{t('procurement.tenders.descWorks')}</span>
            </>
          )}
        </div>

        {/* Bid Comparisons */}
        {bidComparisons.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
              {t('procurement.bidComparison.title')}
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {bidComparisons.map((comp) => (
                <div
                  key={comp.id}
                  className="flex-shrink-0 flex items-center gap-3 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 px-4 py-2.5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-neutral-800 dark:text-neutral-100 truncate max-w-[200px]">
                      {comp.title}
                    </p>
                    <p className="text-xs text-neutral-400">{comp.statusDisplayName ?? comp.status}</p>
                  </div>
                  <Button
                    variant="secondary"
                    size="xs"
                    iconLeft={<BarChart3 size={12} />}
                    onClick={() => navigate(`/tenders/${comp.id}/compare`)}
                  >
                    {t('procurement.bidComparison.compare')}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-44 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 animate-pulse" />
            ))}
          </div>
        ) : displayedRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="w-14 h-14 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
              {activeTab === 'MATERIALS' ? <Package size={28} className="text-neutral-400" /> : <HardHat size={28} className="text-neutral-400" />}
            </div>
            <div>
              <p className="text-base font-medium text-neutral-700 dark:text-neutral-300">
                {activeTab === 'MATERIALS' ? t('procurement.tenders.emptyMaterials') : t('procurement.tenders.emptyWorks')}
              </p>
              <p className="text-sm text-neutral-400 mt-1">
                {search || projectFilter || statusFilter
                  ? t('procurement.tenders.emptyFilterHint')
                  : t('procurement.tenders.emptyCreateHint')}
              </p>
            </div>
            {!search && !projectFilter && !statusFilter && (
              <Button
                variant="primary"
                size="sm"
                iconLeft={<Plus size={14} />}
                onClick={() => navigate('/procurement/new')}
              >
                {t('procurement.tenders.createRequest')}
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {displayedRequests.map((r) => (
              <TenderCard
                key={r.id}
                request={r}
                onEvaluate={setEvaluateRequest}
              />
            ))}
          </div>
        )}
      </div>

      {/* Tender Evaluate Wizard */}
      {evaluateRequest && (
        <React.Suspense fallback={null}>
          <TenderEvaluateWizard
            open={!!evaluateRequest}
            onClose={() => setEvaluateRequest(null)}
          />
        </React.Suspense>
      )}
    </div>
  );
};

export default TendersPage;
