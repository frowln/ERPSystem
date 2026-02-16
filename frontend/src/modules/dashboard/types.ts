// Dashboard module types
// Summary metrics, chart data, and widget definitions

export interface DashboardSummary {
  activeProjects: number;
  totalBudget: number;
  onWatch: number;
  overdue: number;
  projectsByStatus: ProjectStatusCount[];
  budgetVsActual: BudgetVsActualItem[];
  recentProjects: DashboardProject[];
}

export interface ProjectStatusCount {
  status: string;
  count: number;
}

export interface BudgetVsActualItem {
  month: string;
  budget: number;
  actual: number;
}

export interface DashboardProject {
  id: string;
  code: string;
  name: string;
  description?: string;
  status: string;
  type: string;
  priority: string;
  plannedStartDate: string;
  plannedEndDate: string;
  budget: number;
  spentAmount: number;
  managerId: string;
  managerName: string;
  customerName: string;
  progress: number;
  membersCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'list';
  title: string;
  position: number;
  size: 'sm' | 'md' | 'lg' | 'FULL';
  visible: boolean;
  config?: Record<string, unknown>;
}

export interface DashboardFilters {
  dateRange?: '1m' | '3m' | '6m' | '1y';
  projectId?: string;
}

export interface StatusChartDataItem {
  name: string;
  value: number;
  color: string;
}

export interface DashboardMetric {
  label: string;
  value: string | number;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: string;
    label?: string;
  };
  subtitle?: string;
}
