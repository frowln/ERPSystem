import React, { useCallback, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  MapPin,
  Upload,
  Plus,
  X,
  AlertTriangle,
  Clock,
  CheckCircle,
  ChevronRight,
  Calendar,
  User,
  Filter,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { Select } from '@/design-system/components/FormField';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { PlanViewer, type PlanPin } from '@/components/PlanViewer';
import { DefectPinCreateModal } from './DefectPinCreateModal';
import { qualityApi } from '@/api/quality';
import { useProjectOptions } from '@/hooks/useSelectOptions';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { formatDate } from '@/lib/format';
import toast from 'react-hot-toast';
import type {
  FloorPlan,
  DefectOnPlanEntry,
  DefectOnPlanStatus,
} from '@/modules/quality/types';

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

const statusColorMap: Record<string, 'red' | 'yellow' | 'green'> = {
  OPEN: 'red',
  IN_PROGRESS: 'yellow',
  CLOSED: 'green',
};

const getStatusLabel = (status: DefectOnPlanStatus): string => {
  const map: Record<DefectOnPlanStatus, string> = {
    OPEN: t('quality.planView.filterOpen'),
    IN_PROGRESS: t('quality.planView.filterInProgress'),
    CLOSED: t('quality.planView.filterClosed'),
  };
  return map[status];
};

const severityIcon: Record<string, React.ReactNode> = {
  MINOR: <AlertTriangle size={14} className="text-amber-500" />,
  MAJOR: <AlertTriangle size={14} className="text-orange-500" />,
  CRITICAL: <AlertTriangle size={14} className="text-red-500" />,
};

// ---------------------------------------------------------------------------
// Inline SVG placeholder for when no plan is uploaded
// ---------------------------------------------------------------------------

function placeholderPlanUrl(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="1200" height="800">
  <defs>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" stroke-width="0.5"/>
    </pattern>
  </defs>
  <rect width="1200" height="800" fill="#f9fafb"/>
  <rect width="1200" height="800" fill="url(#grid)"/>
  <rect x="60" y="60" width="1080" height="680" fill="none" stroke="#374151" stroke-width="4"/>
  <rect x="60" y="60" width="360" height="340" fill="none" stroke="#374151" stroke-width="3"/>
  <text x="240" y="230" text-anchor="middle" font-size="18" fill="#6b7280" font-family="sans-serif">101</text>
  <rect x="420" y="60" width="360" height="340" fill="none" stroke="#374151" stroke-width="3"/>
  <text x="600" y="230" text-anchor="middle" font-size="18" fill="#6b7280" font-family="sans-serif">102</text>
  <rect x="780" y="60" width="360" height="340" fill="none" stroke="#374151" stroke-width="3"/>
  <text x="960" y="230" text-anchor="middle" font-size="18" fill="#6b7280" font-family="sans-serif">103</text>
  <rect x="60" y="400" width="540" height="340" fill="none" stroke="#374151" stroke-width="3"/>
  <text x="330" y="570" text-anchor="middle" font-size="18" fill="#6b7280" font-family="sans-serif">104</text>
  <rect x="600" y="400" width="540" height="340" fill="none" stroke="#374151" stroke-width="3"/>
  <text x="870" y="570" text-anchor="middle" font-size="18" fill="#6b7280" font-family="sans-serif">105</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

type StatusFilter = 'ALL' | DefectOnPlanStatus;

const DefectPlanViewPage: React.FC = () => {
  const { projectId: paramProjectId } = useParams<{ projectId: string }>();
  const queryClient = useQueryClient();
  const { options: projectOptions } = useProjectOptions();

  // State
  const [selectedProjectId, setSelectedProjectId] = useState(paramProjectId ?? '');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedDefectId, setSelectedDefectId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [addMode, setAddMode] = useState(false);
  const [createCoords, setCreateCoords] = useState<{ x: number; y: number } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const activeProjectId = selectedProjectId || paramProjectId || '';

  // Fetch floor plans
  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['floor-plans', activeProjectId],
    queryFn: () => qualityApi.getPlans(activeProjectId),
    enabled: !!activeProjectId,
  });

  const activePlan = plans.find((p) => p.id === selectedPlanId) ?? plans[0] ?? null;
  const activePlanId = activePlan?.id ?? '';

  // Fetch defects for active plan
  const { data: defects = [], isLoading: defectsLoading } = useQuery({
    queryKey: ['plan-defects', activePlanId],
    queryFn: () => qualityApi.getDefectsByPlan(activePlanId),
    enabled: !!activePlanId,
  });

  // Filter defects
  const filteredDefects = useMemo(() => {
    if (statusFilter === 'ALL') return defects;
    return defects.filter((d) => d.status === statusFilter);
  }, [defects, statusFilter]);

  // Convert defects to pins
  const pins: PlanPin[] = useMemo(
    () =>
      filteredDefects.map((d) => ({
        id: d.id,
        x: d.x,
        y: d.y,
        status: d.status as 'OPEN' | 'IN_PROGRESS' | 'CLOSED',
        label: d.title,
        number: d.number,
      })),
    [filteredDefects],
  );

  // Stats
  const stats = useMemo(() => {
    const total = defects.length;
    const open = defects.filter((d) => d.status === 'OPEN').length;
    const inProgress = defects.filter((d) => d.status === 'IN_PROGRESS').length;
    const closed = defects.filter((d) => d.status === 'CLOSED').length;
    return { total, open, inProgress, closed };
  }, [defects]);

  // Handlers
  const handlePinClick = useCallback((pinId: string) => {
    setSelectedDefectId(pinId);
    setSidebarOpen(true);
  }, []);

  const handlePlanClick = useCallback(
    (coords: { x: number; y: number }) => {
      if (!addMode) return;
      setCreateCoords(coords);
      setAddMode(false);
    },
    [addMode],
  );

  const handleUploadPlan = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !activeProjectId) return;
      try {
        await qualityApi.uploadPlan(activeProjectId, file, file.name);
        queryClient.invalidateQueries({ queryKey: ['floor-plans', activeProjectId] });
        toast.success(t('quality.planView.toastPlanUploaded'));
      } catch {
        toast.error(t('quality.planView.toastPlanUploadError'));
      }
      e.target.value = '';
    },
    [activeProjectId, queryClient],
  );

  const selectedDefect = defects.find((d) => d.id === selectedDefectId) ?? null;
  const planImageUrl = activePlan?.imageUrl || placeholderPlanUrl();
  const isLoading = plansLoading || defectsLoading;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] animate-fade-in">
      {/* Header */}
      <PageHeader
        title={t('quality.planView.title')}
        subtitle={t('quality.planView.subtitle')}
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('quality.title'), href: '/quality' },
          { label: t('quality.planView.title') },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant={addMode ? 'primary' : 'secondary'}
              iconLeft={addMode ? <X size={16} /> : <Plus size={16} />}
              onClick={() => setAddMode(!addMode)}
            >
              {addMode ? t('quality.planView.cancelAdd') : t('quality.planView.addDefect')}
            </Button>
            <label>
              <Button
                variant="secondary"
                iconLeft={<Upload size={16} />}
                onClick={() => {
                  // The click propagates to the label's input
                }}
              >
                {t('quality.planView.uploadPlan')}
              </Button>
              <input
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={handleUploadPlan}
              />
            </label>
          </div>
        }
      />

      {/* Stats bar */}
      <div className="flex items-center gap-4 px-4 py-2.5 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 text-xs font-medium overflow-x-auto shrink-0">
        <StatChip icon={<MapPin size={13} />} label={t('quality.planView.pinCount', { count: String(stats.total) })} />
        <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-700 shrink-0" />
        <StatChip color="text-red-600 dark:text-red-400" icon={<AlertTriangle size={13} />} label={`${t('quality.planView.filterOpen')}: ${stats.open}`} />
        <StatChip color="text-amber-600 dark:text-amber-400" icon={<Clock size={13} />} label={`${t('quality.planView.filterInProgress')}: ${stats.inProgress}`} />
        <StatChip color="text-emerald-600 dark:text-emerald-400" icon={<CheckCircle size={13} />} label={`${t('quality.planView.filterClosed')}: ${stats.closed}`} />
      </div>

      {/* Toolbar: project, floor, filters */}
      <div className="flex items-center gap-3 px-4 py-2 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 shrink-0 flex-wrap">
        {!paramProjectId && (
          <Select
            options={[
              { value: '', label: t('quality.planView.selectProject') },
              ...projectOptions,
            ]}
            value={selectedProjectId}
            onChange={(e) => {
              setSelectedProjectId(e.target.value);
              setSelectedPlanId(null);
            }}
            className="w-52"
          />
        )}
        {plans.length > 1 && (
          <Select
            options={[
              ...plans.map((p) => ({ value: p.id, label: p.name || p.code || t('quality.planView.floor') })),
            ]}
            value={activePlanId}
            onChange={(e) => setSelectedPlanId(e.target.value)}
            className="w-44"
          />
        )}
        <Select
          options={[
            { value: 'ALL', label: t('quality.planView.allFloors') },
            { value: 'OPEN', label: t('quality.planView.filterOpen') },
            { value: 'IN_PROGRESS', label: t('quality.planView.filterInProgress') },
            { value: 'CLOSED', label: t('quality.planView.filterClosed') },
          ]}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="w-40"
        />
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={cn(
            'ml-auto p-2 rounded-lg transition-colors',
            sidebarOpen
              ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
              : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700',
          )}
          title={t('quality.planView.toggleSidebar')}
        >
          <Filter size={16} />
        </button>
      </div>

      {/* Add mode hint */}
      {addMode && (
        <div className="flex items-center gap-2 px-4 py-2 bg-primary-50 dark:bg-primary-900/20 border-b border-primary-200 dark:border-primary-800 text-sm text-primary-700 dark:text-primary-300 shrink-0">
          <MapPin size={16} />
          {t('quality.planView.clickToAdd')}
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Plan viewer */}
        <div className="flex-1 relative">
          {!activeProjectId ? (
            <EmptyState
              icon={<MapPin size={48} className="text-neutral-300 dark:text-neutral-600" />}
              title={t('quality.planView.selectProject')}
              description={t('quality.planView.selectProjectHint')}
            />
          ) : plans.length === 0 && !plansLoading ? (
            <EmptyState
              icon={<Upload size={48} className="text-neutral-300 dark:text-neutral-600" />}
              title={t('quality.planView.noPlan')}
              description={t('quality.planView.noPlanHint')}
            />
          ) : (
            <PlanViewer
              planImageUrl={planImageUrl}
              pins={pins}
              onPinClick={handlePinClick}
              onPlanClick={handlePlanClick}
              selectedPinId={selectedDefectId ?? undefined}
              addMode={addMode}
            />
          )}

          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-neutral-900/50">
              <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Sidebar: defect list / detail */}
        {sidebarOpen && (
          <div className="w-80 shrink-0 border-l border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 flex flex-col overflow-hidden">
            {selectedDefect ? (
              <DefectDetailPanel
                defect={selectedDefect}
                onClose={() => setSelectedDefectId(null)}
              />
            ) : (
              <DefectListPanel
                defects={filteredDefects}
                selectedId={selectedDefectId}
                onSelect={(id) => setSelectedDefectId(id)}
              />
            )}
          </div>
        )}
      </div>

      {/* Create modal */}
      {createCoords && activePlanId && (
        <DefectPinCreateModal
          open={!!createCoords}
          onClose={() => setCreateCoords(null)}
          planId={activePlanId}
          coords={createCoords}
        />
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const StatChip: React.FC<{ label: string; color?: string; icon?: React.ReactNode }> = ({
  label,
  color,
  icon,
}) => (
  <div className={cn('flex items-center gap-1.5 shrink-0', color ?? 'text-neutral-600 dark:text-neutral-300')}>
    {icon}
    <span>{label}</span>
  </div>
);

const EmptyState: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({
  icon,
  title,
  description,
}) => (
  <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
    {icon}
    <div>
      <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{title}</h3>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{description}</p>
    </div>
  </div>
);

const DefectListPanel: React.FC<{
  defects: DefectOnPlanEntry[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}> = ({ defects, selectedId, onSelect }) => (
  <div className="flex flex-col h-full">
    <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700 shrink-0">
      <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
        {t('quality.planView.sidebarTitle')}
      </h3>
      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
        {t('quality.planView.pinCount', { count: String(defects.length) })}
      </p>
    </div>
    <div className="flex-1 overflow-y-auto">
      {defects.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-sm text-neutral-400">
          {t('quality.planView.sidebarEmpty')}
        </div>
      ) : (
        defects.map((d) => (
          <button
            key={d.id}
            onClick={() => onSelect(d.id)}
            className={cn(
              'w-full text-left px-4 py-3 border-b border-neutral-100 dark:border-neutral-700/50 transition-colors',
              selectedId === d.id
                ? 'bg-primary-50 dark:bg-primary-900/20'
                : 'hover:bg-neutral-50 dark:hover:bg-neutral-700/50',
            )}
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0',
                  d.status === 'OPEN' && 'bg-red-500',
                  d.status === 'IN_PROGRESS' && 'bg-amber-500',
                  d.status === 'CLOSED' && 'bg-emerald-500',
                )}
              >
                {d.number}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                  {d.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  {severityIcon[d.severity]}
                  <StatusBadge
                    status={d.status}
                    colorMap={statusColorMap}
                    label={getStatusLabel(d.status)}
                  />
                </div>
              </div>
              <ChevronRight size={14} className="text-neutral-300 shrink-0 ml-auto" />
            </div>
          </button>
        ))
      )}
    </div>
  </div>
);

const DefectDetailPanel: React.FC<{
  defect: DefectOnPlanEntry;
  onClose: () => void;
}> = ({ defect, onClose }) => (
  <div className="flex flex-col h-full">
    <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-700 shrink-0">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white',
            defect.status === 'OPEN' && 'bg-red-500',
            defect.status === 'IN_PROGRESS' && 'bg-amber-500',
            defect.status === 'CLOSED' && 'bg-emerald-500',
          )}
        >
          {defect.number}
        </span>
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          #{defect.number}
        </h3>
      </div>
      <button
        onClick={onClose}
        className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
      >
        <X size={16} className="text-neutral-400" />
      </button>
    </div>

    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
      <h4 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
        {defect.title}
      </h4>

      {defect.description && (
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          {defect.description}
        </p>
      )}

      <div className="space-y-3">
        <DetailRow icon={AlertTriangle} label={t('quality.planView.fieldSeverity')}>
          <span className={cn(
            'text-sm font-medium',
            defect.severity === 'MINOR' && 'text-amber-600 dark:text-amber-400',
            defect.severity === 'MAJOR' && 'text-orange-600 dark:text-orange-400',
            defect.severity === 'CRITICAL' && 'text-red-600 dark:text-red-400',
          )}>
            {defect.severity === 'MINOR' && t('quality.planView.severityMinor')}
            {defect.severity === 'MAJOR' && t('quality.planView.severityMajor')}
            {defect.severity === 'CRITICAL' && t('quality.planView.severityCritical')}
          </span>
        </DetailRow>

        <DetailRow icon={CheckCircle} label={t('quality.planView.fieldStatus')}>
          <StatusBadge
            status={defect.status}
            colorMap={statusColorMap}
            label={getStatusLabel(defect.status)}
          />
        </DetailRow>

        {defect.assigneeName && (
          <DetailRow icon={User} label={t('quality.planView.fieldAssignee')}>
            <span className="text-sm text-neutral-700 dark:text-neutral-200">
              {defect.assigneeName}
            </span>
          </DetailRow>
        )}

        {defect.dueDate && (
          <DetailRow icon={Calendar} label={t('quality.planView.fieldDueDate')}>
            <span className="text-sm tabular-nums text-neutral-700 dark:text-neutral-200">
              {formatDate(defect.dueDate)}
            </span>
          </DetailRow>
        )}

        <DetailRow icon={MapPin} label={t('quality.planView.coordsLabel')}>
          <span className="text-sm font-mono text-neutral-500 dark:text-neutral-400">
            ({defect.x.toFixed(1)}%, {defect.y.toFixed(1)}%)
          </span>
        </DetailRow>

        <DetailRow icon={Clock} label={t('quality.planView.fieldCreated')}>
          <span className="text-sm tabular-nums text-neutral-500 dark:text-neutral-400">
            {formatDate(defect.createdAt)}
          </span>
        </DetailRow>
      </div>
    </div>
  </div>
);

const DetailRow: React.FC<{
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}> = ({ icon: Icon, label, children }) => (
  <div className="flex items-start gap-3">
    <Icon size={14} className="text-neutral-400 mt-0.5 shrink-0" />
    <div>
      <p className="text-xs text-neutral-500 dark:text-neutral-400">{label}</p>
      <div className="mt-0.5">{children}</div>
    </div>
  </div>
);

export default DefectPlanViewPage;
