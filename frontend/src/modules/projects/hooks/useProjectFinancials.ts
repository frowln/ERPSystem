import type { Project, ProjectFinancialSummary } from '@/types';

export interface ComputedFinancials {
  contractAmount: number;
  plannedBudget: number;
  actualCost: number;
  margin: number;
  profitabilityPct: number;
  budgetUtilPct: number;
  cashFlow: number;
  committed: number;
  completionPct: number;
  invoicedToCustomer: number;
  receivedPayments: number;
  accountsReceivable: number;
  accountsPayable: number;
  paidToSuppliers: number;
  estimateTotal: number;
  remaining: number;
  daysRemaining: number;
}

export function useProjectFinancials(
  project: Project | undefined,
  financials: ProjectFinancialSummary | undefined,
): ComputedFinancials {
  const p = project;
  const fin = financials;
  const cf = p?.computedFinancials;

  const contractAmount = fin?.contractAmount ?? cf?.contractAmount ?? p?.contractAmount ?? 0;
  const plannedBudget = fin?.plannedBudget ?? cf?.plannedBudget ?? p?.budget ?? 0;
  const actualCost = fin?.actualCost ?? cf?.actualCost ?? p?.spentAmount ?? 0;
  const margin = fin?.margin ?? cf?.margin ?? (contractAmount - actualCost);
  const profitabilityPct = fin?.profitabilityPercent ?? cf?.profitabilityPercent ?? 0;
  const budgetUtilPct = fin?.budgetUtilizationPercent ?? cf?.budgetUtilizationPercent ?? (plannedBudget > 0 ? (actualCost / plannedBudget) * 100 : 0);
  const cashFlow = fin?.cashFlow ?? cf?.cashFlow ?? 0;
  const committed = fin?.committed ?? cf?.committed ?? 0;
  const completionPct = fin?.completionPercent ?? cf?.completionPercent ?? p?.progress ?? 0;
  const invoicedToCustomer = fin?.invoicedToCustomer ?? cf?.invoicedToCustomer ?? 0;
  const receivedPayments = fin?.receivedPayments ?? cf?.receivedPayments ?? 0;
  const accountsReceivable = fin?.accountsReceivable ?? cf?.accountsReceivable ?? 0;
  const accountsPayable = fin?.accountsPayable ?? cf?.accountsPayable ?? 0;
  const paidToSuppliers = fin?.paidToSuppliers ?? cf?.paidToSuppliers ?? 0;
  const estimateTotal = fin?.estimateTotal ?? cf?.estimateTotal ?? 0;
  const remaining = plannedBudget - actualCost;
  const daysRemaining = Math.max(
    0,
    Math.ceil((new Date(p?.plannedEndDate ?? '').getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
  );

  return {
    contractAmount, plannedBudget, actualCost, margin, profitabilityPct,
    budgetUtilPct, cashFlow, committed, completionPct, invoicedToCustomer,
    receivedPayments, accountsReceivable, accountsPayable, paidToSuppliers,
    estimateTotal, remaining, daysRemaining,
  };
}
