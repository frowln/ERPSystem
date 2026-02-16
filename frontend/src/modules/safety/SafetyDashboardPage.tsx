import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  ShieldCheck,
  AlertTriangle,
  ClipboardCheck,
  Calendar,
  Plus,
  Search,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Input } from '@/design-system/components/FormField';
import { safetyApi } from '@/api/safety';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import type { SafetyInspection, SafetyViolation } from './types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Inspection {
  id: string;
  number: string;
  projectName: string;
  type: string;
  date: string;
  inspector: string;
  score: number;
  status: 'PASSED' | 'FAILED' | 'IN_PROGRESS' | 'SCHEDULED';
  findings: number;
}

interface Violation {
  id: string;
  number: string;
  description: string;
  projectName: string;
  severity: 'MINOR' | 'MODERATE' | 'SERIOUS' | 'CRITICAL';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  assignedTo: string;
  dueDate: string;
  createdAt: string;
}

const mapInspectionStatus = (status: SafetyInspection['status']): Inspection['status'] => {
  switch (status) {
    case 'SCHEDULED':
      return 'SCHEDULED';
    case 'IN_PROGRESS':
      return 'IN_PROGRESS';
    case 'FAILED':
      return 'FAILED';
    case 'COMPLETED':
      return 'PASSED';
    case 'CANCELLED':
      return 'SCHEDULED';
    default:
      return 'SCHEDULED';
  }
};

const mapViolationSeverity = (severity: SafetyViolation['severity']): Violation['severity'] => {
  switch (severity) {
    case 'LOW':
      return 'MINOR';
    case 'MEDIUM':
      return 'MODERATE';
    case 'HIGH':
      return 'SERIOUS';
    case 'CRITICAL':
      return 'CRITICAL';
    default:
      return 'MODERATE';
  }
};

const mapViolationStatus = (status: SafetyViolation['status']): Violation['status'] => {
  switch (status) {
    case 'OPEN':
      return 'OPEN';
    case 'IN_PROGRESS':
      return 'IN_PROGRESS';
    case 'RESOLVED':
      return 'RESOLVED';
    case 'CLOSED':
      return 'CLOSED';
    case 'OVERDUE':
      return 'OPEN';
    default:
      return 'OPEN';
  }
};

const inspectionStatusColorMap: Record<string, 'green' | 'red' | 'yellow' | 'blue' | 'gray'> = {
  passed: 'green',
  failed: 'red',
  in_progress: 'yellow',
  scheduled: 'blue',
};

const getInspectionStatusLabels = (): Record<string, string> => ({
  passed: t('safety.dashboard.inspectionStatusPassed'),
  failed: t('safety.dashboard.inspectionStatusFailed'),
  in_progress: t('safety.dashboard.inspectionStatusInProgress'),
  scheduled: t('safety.dashboard.inspectionStatusScheduled'),
});

const violationSeverityColorMap: Record<string, 'gray' | 'yellow' | 'orange' | 'red'> = {
  minor: 'gray',
  moderate: 'yellow',
  serious: 'orange',
  critical: 'red',
};

const getViolationSeverityLabels = (): Record<string, string> => ({
  minor: t('safety.dashboard.violationSeverityMinor'),
  moderate: t('safety.dashboard.violationSeverityModerate'),
  serious: t('safety.dashboard.violationSeveritySerious'),
  critical: t('safety.dashboard.violationSeverityCritical'),
});

const violationStatusColorMap: Record<string, 'blue' | 'yellow' | 'green' | 'gray'> = {
  open: 'blue',
  in_progress: 'yellow',
  resolved: 'green',
  closed: 'gray',
};

const getViolationStatusLabels = (): Record<string, string> => ({
  open: t('safety.dashboard.violationStatusOpen'),
  in_progress: t('safety.dashboard.violationStatusInProgress'),
  resolved: t('safety.dashboard.violationStatusResolved'),
  closed: t('safety.dashboard.violationStatusClosed'),
});

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const SafetyDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'inspections' | 'violations'>('inspections');
  const [search, setSearch] = useState('');

  const { data: inspData, isLoading: loadingInsp } = useQuery({
    queryKey: ['safety-inspections'],
    queryFn: () => safetyApi.getInspections(),
  });

  const { data: violData, isLoading: loadingViol } = useQuery({
    queryKey: ['safety-violations'],
    queryFn: () => safetyApi.getViolations(),
  });

  const inspections: Inspection[] = (inspData?.content ?? []).map((inspection) => ({
    id: inspection.id,
    number: inspection.number,
    projectName: inspection.projectName,
    type: inspection.inspectionType,
    date: inspection.inspectionDate,
    inspector: inspection.inspectorName,
    score: inspection.score,
    status: mapInspectionStatus(inspection.status),
    findings: inspection.findingsCount,
  }));

  const violations: Violation[] = (violData?.content ?? []).map((violation) => ({
    id: violation.id,
    number: violation.number,
    description: violation.description,
    projectName: violation.projectName,
    severity: mapViolationSeverity(violation.severity),
    status: mapViolationStatus(violation.status),
    assignedTo: violation.responsibleName,
    dueDate: violation.deadline,
    createdAt: violation.createdAt,
  }));

  const openViolations = violations.filter((v) => v.status === 'OPEN' || v.status === 'IN_PROGRESS');
  const avgScore = inspections.filter((i) => i.score > 0).reduce((s, i) => s + i.score, 0) / (inspections.filter((i) => i.score > 0).length || 1);

  const inspectionColumns = useMemo<ColumnDef<Inspection, unknown>[]>(() => [
    { accessorKey: 'number', header: '\u2116', size: 90, cell: ({ getValue }) => <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400">{getValue<string>()}</span> },
    { accessorKey: 'projectName', header: t('safety.dashboard.columnProject'), size: 180 },
    { accessorKey: 'type', header: t('safety.dashboard.columnInspectionType'), size: 170 },
    { accessorKey: 'date', header: t('safety.dashboard.columnDate'), size: 100, cell: ({ getValue }) => <span className="tabular-nums">{formatDate(getValue<string>())}</span> },
    { accessorKey: 'inspector', header: t('safety.dashboard.columnInspector'), size: 140 },
    {
      accessorKey: 'score',
      header: t('safety.dashboard.columnScore'),
      size: 80,
      cell: ({ getValue, row }) => {
        const score = getValue<number>();
        if (row.original.status === 'SCHEDULED' || row.original.status === 'IN_PROGRESS') return <span className="text-neutral-400">---</span>;
        return (
          <span className={cn('font-semibold tabular-nums', score >= 90 ? 'text-success-600' : score >= 70 ? 'text-warning-600' : 'text-danger-600')}>
            {score}%
          </span>
        );
      },
    },
    {
      accessorKey: 'status',
      header: t('safety.dashboard.columnStatus'),
      size: 130,
      cell: ({ getValue }) => <StatusBadge status={getValue<string>()} colorMap={inspectionStatusColorMap} label={getInspectionStatusLabels()[getValue<string>()] ?? getValue<string>()} />,
    },
    { accessorKey: 'findings', header: t('safety.dashboard.columnFindings'), size: 100, cell: ({ getValue }) => <span className="tabular-nums">{getValue<number>()}</span> },
  ], []);

  const violationColumns = useMemo<ColumnDef<Violation, unknown>[]>(() => [
    { accessorKey: 'number', header: '\u2116', size: 90, cell: ({ getValue }) => <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400">{getValue<string>()}</span> },
    {
      accessorKey: 'description',
      header: t('safety.dashboard.columnDescription'),
      size: 280,
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[260px]">{row.original.description}</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.projectName}</p>
        </div>
      ),
    },
    { accessorKey: 'severity', header: t('safety.dashboard.columnSeverity'), size: 140, cell: ({ getValue }) => <StatusBadge status={getValue<string>()} colorMap={violationSeverityColorMap} label={getViolationSeverityLabels()[getValue<string>()] ?? getValue<string>()} /> },
    { accessorKey: 'status', header: t('safety.dashboard.columnStatus'), size: 120, cell: ({ getValue }) => <StatusBadge status={getValue<string>()} colorMap={violationStatusColorMap} label={getViolationStatusLabels()[getValue<string>()] ?? getValue<string>()} /> },
    { accessorKey: 'assignedTo', header: t('safety.dashboard.columnResponsible'), size: 140 },
    {
      accessorKey: 'dueDate',
      header: t('safety.dashboard.columnDeadline'),
      size: 110,
      cell: ({ row }) => {
        const isOverdue = new Date(row.original.dueDate) < new Date() && ['OPEN', 'IN_PROGRESS'].includes(row.original.status);
        return <span className={cn('tabular-nums', isOverdue && 'text-danger-600 font-medium')}>{formatDate(row.original.dueDate)}</span>;
      },
    },
  ], []);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('safety.dashboard.title')}
        subtitle={t('safety.dashboard.subtitle')}
        breadcrumbs={[{ label: t('safety.dashboard.breadcrumbHome'), href: '/' }, { label: t('safety.dashboard.breadcrumbSafety') }]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" iconLeft={<ClipboardCheck size={16} />}>{t('safety.dashboard.actionBriefing')}</Button>
            <Button variant="secondary" iconLeft={<AlertTriangle size={16} />}>{t('safety.dashboard.actionReportIncident')}</Button>
            <Button iconLeft={<Plus size={16} />}>{t('safety.dashboard.actionNewInspection')}</Button>
          </div>
        }
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<AlertTriangle size={18} />}
          label={t('safety.dashboard.metricIncidentsThisMonth')}
          value="0"
          trend={{ direction: 'down', value: '-100%', label: t('safety.dashboard.metricComparedToPrevMonth') }}
          subtitle={t('safety.dashboard.metricComparedToPrevMonth')}
        />
        <MetricCard
          icon={<ShieldCheck size={18} />}
          label={t('safety.dashboard.metricOpenViolations')}
          value={openViolations.length}
          trend={{ direction: openViolations.length > 3 ? 'up' : 'down', value: `${openViolations.length}` }}
          subtitle={t('safety.dashboard.metricRequireResolution')}
        />
        <MetricCard
          icon={<ClipboardCheck size={18} />}
          label={t('safety.dashboard.metricAvgInspectionScore')}
          value={`${avgScore.toFixed(0)}%`}
          trend={{ direction: avgScore >= 85 ? 'up' : 'down', value: avgScore >= 85 ? '+3%' : '-2%' }}
          subtitle={t('safety.dashboard.metricLast30Days')}
        />
        <MetricCard
          icon={<Calendar size={18} />}
          label={t('safety.dashboard.metricDaysWithoutIncident')}
          value="47"
          trend={{ direction: 'up', value: '+47' }}
          subtitle={t('safety.dashboard.metricCurrentStreak')}
        />
      </div>

      {/* Safety score trend placeholder */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5 mb-6">
        <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">{t('safety.dashboard.safetyIndexTrend')}</h3>
        <div className="h-48 flex items-center justify-center bg-neutral-50 dark:bg-neutral-800 rounded-lg">
          <div className="flex items-center gap-6">
            {[85, 88, 82, 90, 87, 92, 89, 91, 88, 93, 90, 92].map((val, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div
                  className={cn('w-6 rounded-t', val >= 90 ? 'bg-success-400' : val >= 80 ? 'bg-warning-400' : 'bg-danger-400')}
                  style={{ height: `${val * 1.5}px` }}
                />
                <span className="text-[10px] text-neutral-400">{val}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-neutral-200 dark:border-neutral-700 mb-4">
        <button
          onClick={() => setActiveTab('inspections')}
          className={cn(
            'relative px-1 pb-3 text-sm font-medium transition-colors',
            activeTab === 'inspections'
              ? 'text-primary-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary-600'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300',
          )}
        >
          {t('safety.dashboard.tabInspections')} ({inspections.length})
        </button>
        <button
          onClick={() => setActiveTab('violations')}
          className={cn(
            'relative px-1 pb-3 text-sm font-medium transition-colors',
            activeTab === 'violations'
              ? 'text-primary-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary-600'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300',
          )}
        >
          {t('safety.dashboard.tabViolations')} ({violations.length})
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input placeholder={t('safety.dashboard.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      {activeTab === 'inspections' ? (
        <DataTable<Inspection>
          data={inspections}
          columns={inspectionColumns}
          loading={loadingInsp}
          enableRowSelection
          enableColumnVisibility
          enableExport
          pageSize={20}
          emptyTitle={t('safety.dashboard.emptyInspectionsTitle')}
          emptyDescription={t('safety.dashboard.emptyInspectionsDescription')}
        />
      ) : (
        <DataTable<Violation>
          data={violations}
          columns={violationColumns}
          loading={loadingViol}
          enableRowSelection
          enableColumnVisibility
          enableExport
          pageSize={20}
          emptyTitle={t('safety.dashboard.emptyViolationsTitle')}
          emptyDescription={t('safety.dashboard.emptyViolationsDescription')}
        />
      )}
    </div>
  );
};

export default SafetyDashboardPage;
