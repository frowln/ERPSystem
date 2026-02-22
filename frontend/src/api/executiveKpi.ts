import { apiClient } from './client';

export type HealthStatus = 'GREEN' | 'YELLOW' | 'RED';

export interface PortfolioSummary {
  totalContractValue: number;
  totalInvoiced: number;
  totalPaid: number;
  totalBudget: number;
  totalSpent: number;
  ebitMargin: number;
  projectCount: number;
  activeProjectCount: number;
}

export interface ProjectHealth {
  projectId: string;
  projectName: string;
  cpi: number;
  spi: number;
  healthStatus: HealthStatus;
  contractAmount: number;
  budgetAmount: number;
  spentAmount: number;
  scheduledCompletion?: string;
  forecastCompletion?: string;
}

export interface CashPosition {
  totalAR: number;
  totalAP: number;
  netCash: number;
  arBucket0_30: number;
  arBucket31_60: number;
  arBucket61_90: number;
  arBucket90Plus: number;
}

export interface SafetyMetrics {
  totalIncidents: number;
  trir: number;
  daysSinceLastIncident: number;
  severityBreakdown: Record<string, number>;
}

export interface ResourceUtilization {
  totalWorkers: number;
  allocatedWorkers: number;
  workerUtilizationPercent: number;
  totalEquipment: number;
  allocatedEquipment: number;
  equipmentUtilizationPercent: number;
}

export interface ExecutiveDashboard {
  portfolioSummary: PortfolioSummary;
  projectHealth: ProjectHealth[];
  cashPosition: CashPosition;
  safetyMetrics: SafetyMetrics;
  resourceUtilization: ResourceUtilization;
}

export interface ProjectDrillDown {
  projectId: string;
  projectName: string;
  contractAmount: number;
  budgetAmount: number;
  spentAmount: number;
  invoicedAmount: number;
  paidAmount: number;
  cpi: number;
  spi: number;
  healthStatus: HealthStatus;
  budgetItems: { name: string; planned: number; actual: number; variance: number }[];
  recentTransactions: { date: string; type: string; amount: number; description: string }[];
}

export const executiveKpiApi = {
  getDashboard: async (): Promise<ExecutiveDashboard> => {
    const response = await apiClient.get<ExecutiveDashboard>('/analytics/executive/dashboard');
    return response.data;
  },

  getPortfolioSummary: async (): Promise<PortfolioSummary> => {
    const response = await apiClient.get<PortfolioSummary>('/analytics/executive/portfolio-summary');
    return response.data;
  },

  getProjectHealth: async (): Promise<ProjectHealth[]> => {
    const response = await apiClient.get<ProjectHealth[]>('/analytics/executive/project-health');
    return response.data;
  },

  getCashPosition: async (): Promise<CashPosition> => {
    const response = await apiClient.get<CashPosition>('/analytics/executive/cash-position');
    return response.data;
  },

  getSafetyMetrics: async (): Promise<SafetyMetrics> => {
    const response = await apiClient.get<SafetyMetrics>('/analytics/executive/safety-metrics');
    return response.data;
  },

  getResourceUtilization: async (): Promise<ResourceUtilization> => {
    const response = await apiClient.get<ResourceUtilization>('/analytics/executive/resource-utilization');
    return response.data;
  },

  getProjectDrillDown: async (projectId: string): Promise<ProjectDrillDown> => {
    const response = await apiClient.get<ProjectDrillDown>(`/analytics/executive/project/${projectId}/drilldown`);
    return response.data;
  },
};
