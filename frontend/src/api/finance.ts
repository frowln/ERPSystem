import { apiClient } from './client';
import type {
  Budget,
  BudgetItem,
  BudgetSnapshot,
  SnapshotComparison,
  Payment,
  Invoice,
  InvoiceLine,
  InvoiceMatchCandidate,
  ThreeWayMatchResult,
  ProjectSection,
  FinanceExpenseItem,
  ContractBudgetItem,
  CompetitiveList,
  CompetitiveListEntry,
  CompetitiveListStatus,
  CommercialProposal,
  CommercialProposalItem,
  PaginatedResponse,
  PaginationParams,
} from '@/types';

export interface BudgetFilters extends PaginationParams {
  status?: string;
  projectId?: string;
  search?: string;
}

export interface InvoiceFilters extends PaginationParams {
  projectId?: string;
  invoiceType?: string;
}

export interface ExpenseFilters extends PaginationParams {
  projectId?: string;
  disciplineMark?: string;
  docStatus?: string;
}

export interface CreateCommercialProposalRequest {
  budgetId: string;
  name: string;
  notes?: string;
}

export interface CashFlowEntry {
  id: string;
  month: string;
  incoming: number;
  outgoing: number;
  net: number;
}

export interface CashFlowChartData {
  startBalance: number;
  monthlyData: {
    month: string;
    monthShort: string;
    inflow: number;
    outflow: number;
  }[];
}

export const financeApi = {
  getBudgets: async (params?: BudgetFilters): Promise<PaginatedResponse<Budget>> => {
    const response = await apiClient.get<PaginatedResponse<Budget>>('/budgets', { params });
    return response.data;
  },

  getBudget: async (id: string): Promise<Budget> => {
    const response = await apiClient.get<Budget>(`/budgets/${id}`);
    return response.data;
  },

  getBudgetItems: async (budgetId: string): Promise<BudgetItem[]> => {
    const response = await apiClient.get<BudgetItem[]>(`/budgets/${budgetId}/items`);
    return response.data;
  },

  getPayments: async (params?: PaginationParams & { projectId?: string }): Promise<PaginatedResponse<Payment>> => {
    const response = await apiClient.get<PaginatedResponse<Payment>>('/payments', { params });
    return response.data;
  },

  getInvoices: async (params?: InvoiceFilters): Promise<PaginatedResponse<Invoice>> => {
    const response = await apiClient.get<PaginatedResponse<Invoice>>('/invoices', { params });
    return response.data;
  },

  getInvoiceLines: async (invoiceId: string): Promise<InvoiceLine[]> => {
    const response = await apiClient.get<InvoiceLine[]>(`/invoices/${invoiceId}/lines`);
    return response.data;
  },

  createBudget: async (data: Partial<Budget>): Promise<Budget> => {
    const response = await apiClient.post<Budget>('/budgets', data);
    return response.data;
  },

  createPayment: async (data: Partial<Payment>): Promise<Payment> => {
    const response = await apiClient.post<Payment>('/payments', data);
    return response.data;
  },

  createInvoice: async (data: Partial<Invoice>): Promise<Invoice> => {
    const response = await apiClient.post<Invoice>('/invoices', data);
    return response.data;
  },

  getInvoice: async (id: string): Promise<Invoice> => {
    const response = await apiClient.get<Invoice>(`/invoices/${id}`);
    return response.data;
  },

  changeInvoiceStatus: async (id: string, status: string): Promise<Invoice> => {
    const response = await apiClient.post<Invoice>(`/invoices/${id}/status`, { status });
    return response.data;
  },

  getPayment: async (id: string): Promise<Payment> => {
    const response = await apiClient.get<Payment>(`/payments/${id}`);
    return response.data;
  },

  getCashFlow: async (): Promise<CashFlowEntry[]> => {
    const response = await apiClient.get<CashFlowEntry[]>('/cash-flow');
    return response.data;
  },

  getCashFlowChart: async (): Promise<CashFlowChartData> => {
    const response = await apiClient.get<CashFlowChartData>('/cash-flow/chart');
    return response.data;
  },

  getExpenses: async (params?: ExpenseFilters): Promise<PaginatedResponse<FinanceExpenseItem>> => {
    const response = await apiClient.get<PaginatedResponse<FinanceExpenseItem>>('/finance/expenses', { params });
    return response.data;
  },

  getProjectSections: async (projectId: string): Promise<ProjectSection[]> => {
    const response = await apiClient.get<ProjectSection[]>(`/projects/${projectId}/sections`);
    return response.data;
  },

  updateProjectSections: async (projectId: string, data: { id: string; enabled: boolean; sequence?: number }[]): Promise<void> => {
    await apiClient.put(`/projects/${projectId}/sections`, { sections: data });
  },

  addCustomSection: async (projectId: string, data: { code: string; name: string }): Promise<ProjectSection> => {
    const response = await apiClient.post<ProjectSection>(`/projects/${projectId}/sections/custom`, data);
    return response.data;
  },

  deleteCustomSection: async (projectId: string, sectionId: string): Promise<void> => {
    await apiClient.delete(`/projects/${projectId}/sections/${sectionId}`);
  },

  seedProjectSections: async (projectId: string): Promise<void> => {
    await apiClient.post(`/projects/${projectId}/sections/seed`);
  },

  // Contract Budget Items
  getContractBudgetItems: async (contractId: string): Promise<ContractBudgetItem[]> => {
    const response = await apiClient.get<ContractBudgetItem[]>(`/contracts/${contractId}/budget-items`);
    return response.data;
  },

  getBudgetItemCoverage: async (budgetItemId: string): Promise<{
    covered: number;
    total: number;
    percent: number;
    totalQuantity: number;
    allocatedQuantity: number;
    totalAmount: number;
    allocatedAmount: number;
    amountCoveragePercent: number;
    coveragePercent: number;
  }> => {
    const response = await apiClient.get(`/budget-items/${budgetItemId}/coverage`);
    return response.data;
  },

  linkContractBudgetItems: async (contractId: string, items: { budgetItemId: string; allocatedQuantity?: number; allocatedAmount?: number; notes?: string }[]): Promise<ContractBudgetItem[]> => {
    const response = await apiClient.post<ContractBudgetItem[]>(`/contracts/${contractId}/budget-items`, { items });
    return response.data;
  },

  updateContractBudgetItem: async (contractId: string, itemId: string, data: { allocatedQuantity?: number; allocatedAmount?: number; notes?: string }): Promise<ContractBudgetItem> => {
    const response = await apiClient.put<ContractBudgetItem>(`/contracts/${contractId}/budget-items/${itemId}`, data);
    return response.data;
  },

  unlinkContractBudgetItem: async (contractId: string, itemId: string): Promise<void> => {
    await apiClient.delete(`/contracts/${contractId}/budget-items/${itemId}`);
  },

  // Competitive Lists
  getCompetitiveList: async (id: string): Promise<CompetitiveList | null> => {
    const response = await apiClient.get<CompetitiveList | null>(`/competitive-lists/${id}`);
    return response.data;
  },

  getCompetitiveListEntries: async (competitiveListId: string): Promise<CompetitiveListEntry[]> => {
    const response = await apiClient.get<CompetitiveListEntry[]>(`/competitive-lists/${competitiveListId}/entries`);
    return response.data;
  },

  createCompetitiveList: async (data: { specificationId: string; name: string }): Promise<CompetitiveList> => {
    const response = await apiClient.post<CompetitiveList>('/competitive-lists', data);
    return response.data;
  },

  changeCompetitiveListStatus: async (competitiveListId: string, status: string): Promise<CompetitiveList> => {
    const response = await apiClient.post<CompetitiveList>(`/competitive-lists/${competitiveListId}/status`, { status });
    return response.data;
  },

  addCompetitiveListEntry: async (competitiveListId: string, data: Partial<CompetitiveListEntry>): Promise<CompetitiveListEntry> => {
    const response = await apiClient.post<CompetitiveListEntry>(`/competitive-lists/${competitiveListId}/entries`, data);
    return response.data;
  },

  deleteCompetitiveListEntry: async (competitiveListId: string, entryId: string): Promise<void> => {
    await apiClient.delete(`/competitive-lists/${competitiveListId}/entries/${entryId}`);
  },

  selectCompetitiveListWinner: async (competitiveListId: string, entryId: string, justification?: string): Promise<CompetitiveList> => {
    const response = await apiClient.post<CompetitiveList>(
      `/competitive-lists/${competitiveListId}/entries/${entryId}/select`,
      null,
      { params: { selectionReason: justification } },
    );
    return response.data;
  },

  autoRankEntries: async (competitiveListId: string): Promise<CompetitiveListEntry[]> => {
    const response = await apiClient.post<CompetitiveListEntry[]>(`/competitive-lists/${competitiveListId}/auto-rank`);
    return response.data;
  },

  autoSelectBestPrices: async (competitiveListId: string): Promise<CompetitiveList> => {
    const response = await apiClient.post<CompetitiveList>(`/competitive-lists/${competitiveListId}/auto-select-best`);
    return response.data;
  },

  applyToCp: async (competitiveListId: string, cpId: string): Promise<void> => {
    await apiClient.post(`/competitive-lists/${competitiveListId}/apply-to-cp/${cpId}`);
  },

  // Invoice Matching
  matchInvoiceToPositions: async (invoiceId: string, budgetId: string): Promise<InvoiceMatchCandidate[]> => {
    const response = await apiClient.get<InvoiceMatchCandidate[]>(`/invoices/${invoiceId}/match`, {
      params: { budgetId },
    });
    return response.data;
  },

  validateThreeWayMatch: async (invoiceId: string): Promise<ThreeWayMatchResult> => {
    const response = await apiClient.get<ThreeWayMatchResult>(`/invoices/${invoiceId}/three-way-match`);
    return response.data;
  },

  // ---- Commercial Proposals ----

  getCommercialProposals: async (params?: PaginationParams & { projectId?: string }): Promise<PaginatedResponse<CommercialProposal>> => {
    const response = await apiClient.get<PaginatedResponse<CommercialProposal>>('/commercial-proposals', { params });
    return response.data;
  },

  createCommercialProposal: async (data: CreateCommercialProposalRequest): Promise<CommercialProposal> => {
    const response = await apiClient.post<CommercialProposal>('/commercial-proposals', data);
    return response.data;
  },

  getCommercialProposal: async (id: string): Promise<CommercialProposal> => {
    const response = await apiClient.get<CommercialProposal>(`/commercial-proposals/${id}`);
    return response.data;
  },

  getProposalItems: async (proposalId: string): Promise<CommercialProposalItem[]> => {
    const response = await apiClient.get<CommercialProposalItem[]>(`/commercial-proposals/${proposalId}/items`);
    return response.data;
  },

  changeProposalStatus: async (proposalId: string, status: string): Promise<CommercialProposal> => {
    const response = await apiClient.post<CommercialProposal>(`/commercial-proposals/${proposalId}/status`, { status });
    return response.data;
  },

  confirmAllCpItems: async (proposalId: string): Promise<void> => {
    await apiClient.post(`/commercial-proposals/${proposalId}/confirm-all`);
  },

  approveCpItem: async (proposalId: string, itemId: string): Promise<CommercialProposalItem> => {
    const response = await apiClient.post<CommercialProposalItem>(`/commercial-proposals/${proposalId}/items/${itemId}/approve`);
    return response.data;
  },

  rejectCpItem: async (proposalId: string, itemId: string, reason?: string): Promise<CommercialProposalItem> => {
    const response = await apiClient.post<CommercialProposalItem>(`/commercial-proposals/${proposalId}/items/${itemId}/reject`, { reason });
    return response.data;
  },

  findMatchingInvoiceLines: async (budgetItemId: string, invoiceId?: string, cpItemId?: string): Promise<InvoiceLine[]> => {
    const response = await apiClient.get<InvoiceLine[]>('/commercial-proposals/matching-invoice-lines', {
      params: { budgetItemId, invoiceId, cpItemId },
    });
    return response.data;
  },

  selectInvoiceForCpItem: async (proposalId: string, itemId: string, invoiceLineId: string): Promise<CommercialProposalItem> => {
    const response = await apiClient.post<CommercialProposalItem>(
      `/commercial-proposals/${proposalId}/items/${itemId}/select-invoice`,
      { invoiceLineId },
    );
    return response.data;
  },

  selectClEntryForCpItem: async (proposalId: string, itemId: string, clEntryId: string): Promise<CommercialProposalItem> => {
    const response = await apiClient.post<CommercialProposalItem>(
      `/commercial-proposals/${proposalId}/items/${itemId}/select-cl-entry`,
      null,
      { params: { clEntryId } },
    );
    return response.data;
  },

  pushCpToFm: async (proposalId: string): Promise<CommercialProposal> => {
    const response = await apiClient.post<CommercialProposal>(
      `/commercial-proposals/${proposalId}/push-to-fm`,
    );
    return response.data;
  },

  // Budget Snapshots
  createSnapshot: async (budgetId: string, data: { name: string; notes?: string }): Promise<BudgetSnapshot> => {
    const response = await apiClient.post<BudgetSnapshot>(`/budgets/${budgetId}/snapshots`, data);
    return response.data;
  },

  getSnapshots: async (budgetId: string, params?: PaginationParams): Promise<PaginatedResponse<BudgetSnapshot>> => {
    const response = await apiClient.get<PaginatedResponse<BudgetSnapshot>>(`/budgets/${budgetId}/snapshots`, { params });
    return response.data;
  },

  compareSnapshot: async (budgetId: string, snapshotId: string): Promise<SnapshotComparison> => {
    const response = await apiClient.get<SnapshotComparison>(`/budgets/${budgetId}/snapshots/${snapshotId}/compare`);
    return response.data;
  },

  updateBudgetItem: async (budgetId: string, itemId: string, data: Partial<BudgetItem>): Promise<BudgetItem> => {
    const response = await apiClient.put<BudgetItem>(`/budgets/${budgetId}/items/${itemId}`, data);
    return response.data;
  },

  getBudgetItemCoverageDetail: async (budgetItemId: string): Promise<{
    budgetItemId: string;
    totalQuantity: number;
    allocatedQuantity: number;
    coveragePercent: number;
    totalAmount: number;
    allocatedAmount: number;
    amountCoveragePercent: number;
    contractCount: number;
    covered: number;
    allocations: {
      contractId: string;
      contractNumber?: string;
      contractName?: string;
      partnerName?: string;
      allocatedQuantity: number;
      allocatedAmount: number;
    }[];
  }> => {
    const response = await apiClient.get(`/budget-items/${budgetItemId}/coverage`);
    const data = response.data;
    return {
      ...data,
      covered: data.contractCount ?? 0,
      allocations: data.contracts ?? [],
    };
  },

  getFmDashboard: async (budgetId: string) => {
    const response = await apiClient.get(`/budgets/${budgetId}/dashboard`);
    return response.data;
  },

  exportFm: async (budgetId: string, format: 'xlsx' | 'pdf' = 'xlsx'): Promise<Blob> => {
    const response = await apiClient.get(`/budgets/${budgetId}/export`, {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  },
};
