// Analytics module types
// Chart data shapes, KPI items, and report definitions

export type KpiCategory = 'SCHEDULE' | 'COST' | 'QUALITY' | 'SAFETY' | 'PRODUCTIVITY';
export type KpiTrend = 'up' | 'down' | 'neutral';
export type KpiTargetDirection = 'higher_better' | 'lower_better';

export interface KpiItem {
  id: string;
  name: string;
  description: string;
  target: number;
  actual: number;
  unit: string;
  trend: KpiTrend;
  trendValue: string;
  category: KpiCategory;
  targetDirection: KpiTargetDirection;
  projectId?: string;
  createdAt: string;
  updatedAt: string;
}

export type ReportCategory = 'PROJECT' | 'FINANCE' | 'SAFETY' | 'OPERATIONS';
export type ReportFormat = 'PDF' | 'XLSX' | 'CSV' | 'DOCX';

export interface ReportDefinition {
  id: string;
  title: string;
  description: string;
  category: ReportCategory;
  formats: ReportFormat[];
}

export interface ReportGenerateRequest {
  reportId: string;
  projectId?: string;
  dateFrom: string;
  dateTo: string;
  format: ReportFormat;
}

export interface ReportGenerateResponse {
  id: string;
  reportId: string;
  status: 'PENDING' | 'GENERATING' | 'COMPLETED' | 'FAILED';
  downloadUrl?: string;
  createdAt: string;
}

// Chart data shapes used by AnalyticsDashboardPage
export interface ProjectStatusChartItem {
  name: string;
  value: number;
  color: string;
}

export interface FinancialBarItem {
  month: string;
  revenue: number;
  cost: number;
  profit: number;
}

export interface SafetyMetricItem {
  month: string;
  incidents: number;
  nearMisses: number;
  inspections: number;
}

export interface TaskBurndownItem {
  date: string;
  planned: number;
  actual: number;
  ideal: number;
}

export interface ProcurementSpendItem {
  category: string;
  planned: number;
  actual: number;
}

export interface WarehouseStockItem {
  name: string;
  current: number;
  min: number;
  max: number;
  fill: string;
}

export type DateRangePreset = '1m' | '3m' | '6m' | '1y';

// KPI Achievements & Bonus Calculations

export type BonusStatus = 'DRAFT' | 'CALCULATED' | 'APPROVED' | 'PAID' | 'CANCELLED';

export interface KpiAchievement {
  id: string;
  kpiId: string;
  kpiName: string;
  employeeId: string;
  employeeName: string;
  period: string;
  targetValue: number;
  actualValue: number;
  achievementPercent: number;
  weight: number;
  category: KpiCategory;
  unit: string;
  projectId?: string;
  projectName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BonusCalculation {
  id: string;
  number: string;
  employeeId: string;
  employeeName: string;
  employeePosition: string;
  period: string;
  baseSalary: number;
  bonusPercent: number;
  bonusAmount: number;
  totalAchievement: number;
  kpiCount: number;
  status: BonusStatus;
  approvedById?: string;
  approvedByName?: string;
  approvedAt?: string;
  paidAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
