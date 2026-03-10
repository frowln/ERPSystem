import React, { lazy } from 'react';
import type { ElementType } from 'react';
import {
  FolderKanban,
  Wallet,
  HeartPulse,
  CheckSquare,
  Activity,
  TrendingUp,
  Calendar,
  ShieldAlert,
  Bug,
  Package,
  Users,
  FileText,
  AlertCircle,
  BarChart3,
  GanttChart,
  Battery,
} from 'lucide-react';
import { t } from '@/i18n';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WidgetCategory =
  | 'finance'
  | 'projects'
  | 'tasks'
  | 'quality'
  | 'safety'
  | 'procurement'
  | 'hr'
  | 'documents';

export type WidgetType =
  | 'active_projects'
  | 'budget_overview'
  | 'health_score'
  | 'task_summary'
  | 'recent_activity'
  | 'cash_flow_chart'
  | 'deadline_calendar'
  | 'safety_incidents'
  | 'quality_defects'
  | 'procurement_status'
  | 'team_workload'
  | 'document_status'
  | 'overdue_tasks'
  | 'budget_vs_actual'
  | 'project_timeline'
  | 'battery_progress';

export type WidgetSize = 'sm' | 'md' | 'lg' | 'full';

export interface DashboardWidgetDef {
  id: WidgetType;
  title: () => string;
  description: () => string;
  icon: ElementType;
  category: WidgetCategory;
  defaultSize: WidgetSize;
  component: React.LazyExoticComponent<React.FC> | React.FC;
}

// ---------------------------------------------------------------------------
// Widget registry
// ---------------------------------------------------------------------------

export const WIDGET_REGISTRY: DashboardWidgetDef[] = [
  {
    id: 'active_projects',
    title: () => t('dashboard.wid.activeProjects'),
    description: () => t('dashboard.wid.activeProjectsDesc'),
    icon: FolderKanban,
    category: 'projects',
    defaultSize: 'md',
    component: lazy(() => import('./widgets/ActiveProjectsWidget')),
  },
  {
    id: 'budget_overview',
    title: () => t('dashboard.wid.budgetOverview'),
    description: () => t('dashboard.wid.budgetOverviewDesc'),
    icon: Wallet,
    category: 'finance',
    defaultSize: 'sm',
    component: lazy(() => import('./widgets/BudgetOverviewWidget')),
  },
  {
    id: 'health_score',
    title: () => t('dashboard.wid.healthScore'),
    description: () => t('dashboard.wid.healthScoreDesc'),
    icon: HeartPulse,
    category: 'projects',
    defaultSize: 'full',
    component: lazy(() => import('./widgets/HealthScoreWidget')),
  },
  {
    id: 'task_summary',
    title: () => t('dashboard.wid.taskSummary'),
    description: () => t('dashboard.wid.taskSummaryDesc'),
    icon: CheckSquare,
    category: 'tasks',
    defaultSize: 'sm',
    component: lazy(() => import('./widgets/TaskSummaryWidget')),
  },
  {
    id: 'recent_activity',
    title: () => t('dashboard.wid.recentActivity'),
    description: () => t('dashboard.wid.recentActivityDesc'),
    icon: Activity,
    category: 'projects',
    defaultSize: 'md',
    component: lazy(() => import('./widgets/RecentActivityWidget')),
  },
  {
    id: 'cash_flow_chart',
    title: () => t('dashboard.wid.cashFlowChart'),
    description: () => t('dashboard.wid.cashFlowChartDesc'),
    icon: TrendingUp,
    category: 'finance',
    defaultSize: 'full',
    component: lazy(() => import('./widgets/CashFlowChartWidget')),
  },
  {
    id: 'deadline_calendar',
    title: () => t('dashboard.wid.deadlineCalendar'),
    description: () => t('dashboard.wid.deadlineCalendarDesc'),
    icon: Calendar,
    category: 'tasks',
    defaultSize: 'sm',
    component: lazy(() => import('./widgets/DeadlineCalendarWidget')),
  },
  {
    id: 'safety_incidents',
    title: () => t('dashboard.wid.safetyIncidents'),
    description: () => t('dashboard.wid.safetyIncidentsDesc'),
    icon: ShieldAlert,
    category: 'safety',
    defaultSize: 'sm',
    component: lazy(() => import('./widgets/SafetyIncidentsWidget')),
  },
  {
    id: 'quality_defects',
    title: () => t('dashboard.wid.qualityDefects'),
    description: () => t('dashboard.wid.qualityDefectsDesc'),
    icon: Bug,
    category: 'quality',
    defaultSize: 'sm',
    component: lazy(() => import('./widgets/QualityDefectsWidget')),
  },
  {
    id: 'procurement_status',
    title: () => t('dashboard.wid.procurementStatus'),
    description: () => t('dashboard.wid.procurementStatusDesc'),
    icon: Package,
    category: 'procurement',
    defaultSize: 'sm',
    component: lazy(() => import('./widgets/ProcurementStatusWidget')),
  },
  {
    id: 'team_workload',
    title: () => t('dashboard.wid.teamWorkload'),
    description: () => t('dashboard.wid.teamWorkloadDesc'),
    icon: Users,
    category: 'hr',
    defaultSize: 'md',
    component: lazy(() => import('./widgets/TeamWorkloadWidget')),
  },
  {
    id: 'document_status',
    title: () => t('dashboard.wid.documentStatus'),
    description: () => t('dashboard.wid.documentStatusDesc'),
    icon: FileText,
    category: 'documents',
    defaultSize: 'sm',
    component: lazy(() => import('./widgets/DocumentStatusWidget')),
  },
  {
    id: 'overdue_tasks',
    title: () => t('dashboard.wid.overdueTasks'),
    description: () => t('dashboard.wid.overdueTasksDesc'),
    icon: AlertCircle,
    category: 'tasks',
    defaultSize: 'md',
    component: lazy(() => import('./widgets/OverdueTasksWidget')),
  },
  {
    id: 'budget_vs_actual',
    title: () => t('dashboard.wid.budgetVsActual'),
    description: () => t('dashboard.wid.budgetVsActualDesc'),
    icon: BarChart3,
    category: 'finance',
    defaultSize: 'md',
    component: lazy(() => import('./widgets/BudgetVsActualWidget')),
  },
  {
    id: 'project_timeline',
    title: () => t('dashboard.wid.projectTimeline'),
    description: () => t('dashboard.wid.projectTimelineDesc'),
    icon: GanttChart,
    category: 'projects',
    defaultSize: 'md',
    component: lazy(() => import('./widgets/ProjectTimelineWidget')),
  },
  {
    id: 'battery_progress',
    title: () => t('dashboard.wid.batteryProgress'),
    description: () => t('dashboard.wid.batteryProgressDesc'),
    icon: Battery,
    category: 'projects',
    defaultSize: 'sm',
    component: lazy(() => import('./widgets/BatteryProgressWidget')),
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getWidgetById(id: string): DashboardWidgetDef | undefined {
  return WIDGET_REGISTRY.find((w) => w.id === id);
}

export function getWidgetsByCategory(category: WidgetCategory): DashboardWidgetDef[] {
  return WIDGET_REGISTRY.filter((w) => w.category === category);
}

export const WIDGET_CATEGORIES: WidgetCategory[] = [
  'projects',
  'finance',
  'tasks',
  'quality',
  'safety',
  'procurement',
  'hr',
  'documents',
];

/** CSS grid column span for each widget size */
export const WIDGET_COL_SPAN: Record<WidgetSize, string> = {
  sm: 'col-span-1',
  md: 'col-span-1 md:col-span-2',
  lg: 'col-span-1 md:col-span-2 lg:col-span-3',
  full: 'col-span-1 md:col-span-2 lg:col-span-4',
};
