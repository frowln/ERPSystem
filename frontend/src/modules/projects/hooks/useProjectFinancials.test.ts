// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { useProjectFinancials } from './useProjectFinancials';
import type { Project, ProjectFinancialSummary } from '@/types';

const baseProject: Project = {
  id: 'p1',
  code: 'PRJ-001',
  name: 'Test Project',
  status: 'IN_PROGRESS',
  type: 'RESIDENTIAL',
  priority: 'HIGH',
  plannedStartDate: '2026-01-01',
  plannedEndDate: '2026-12-31',
  budget: 1000000,
  contractAmount: 1200000,
  spentAmount: 400000,
  managerId: 'u1',
  managerName: 'Test Manager',
  customerName: 'Test Customer',
  progress: 35,
  membersCount: 8,
  createdAt: '2025-12-01T00:00:00',
  updatedAt: '2026-02-15T00:00:00',
};

const baseFinancials: ProjectFinancialSummary = {
  projectId: 'p1',
  contractAmount: 1500000,
  invoicedToCustomer: 600000,
  receivedPayments: 500000,
  accountsReceivable: 100000,
  plannedBudget: 1200000,
  estimateTotal: 1100000,
  committed: 800000,
  subcontractAmount: 300000,
  supplyAmount: 200000,
  serviceAmount: 100000,
  invoicedFromSuppliers: 350000,
  paidToSuppliers: 320000,
  accountsPayable: 30000,
  actualCost: 700000,
  margin: 800000,
  profitabilityPercent: 53.3,
  budgetUtilizationPercent: 58.3,
  cashFlow: 180000,
  completionPercent: 42,
  preliminaryBudget: 1000000,
  preliminaryContractAmount: 1100000,
};

describe('useProjectFinancials', () => {
  it('returns financials data when both project and financials provided', () => {
    const result = useProjectFinancials(baseProject, baseFinancials);
    expect(result.contractAmount).toBe(1500000);
    expect(result.plannedBudget).toBe(1200000);
    expect(result.actualCost).toBe(700000);
    expect(result.margin).toBe(800000);
    expect(result.profitabilityPct).toBe(53.3);
    expect(result.budgetUtilPct).toBe(58.3);
    expect(result.cashFlow).toBe(180000);
    expect(result.committed).toBe(800000);
    expect(result.completionPct).toBe(42);
    expect(result.invoicedToCustomer).toBe(600000);
    expect(result.receivedPayments).toBe(500000);
    expect(result.accountsReceivable).toBe(100000);
    expect(result.accountsPayable).toBe(30000);
    expect(result.paidToSuppliers).toBe(320000);
    expect(result.estimateTotal).toBe(1100000);
  });

  it('computes remaining from plannedBudget - actualCost', () => {
    const result = useProjectFinancials(baseProject, baseFinancials);
    expect(result.remaining).toBe(1200000 - 700000); // 500000
  });

  it('falls back to project data when financials is undefined', () => {
    const result = useProjectFinancials(baseProject, undefined);
    expect(result.contractAmount).toBe(1200000); // from project.contractAmount
    expect(result.plannedBudget).toBe(1000000); // from project.budget
    expect(result.actualCost).toBe(400000); // from project.spentAmount
    expect(result.completionPct).toBe(35); // from project.progress
  });

  it('falls back to computedFinancials on project when financials is undefined', () => {
    const projectWithComputed: Project = {
      ...baseProject,
      computedFinancials: {
        contractAmount: 1300000,
        plannedBudget: 1100000,
        actualCost: 500000,
        margin: 800000,
        profitabilityPercent: 61.5,
        budgetUtilizationPercent: 45.5,
        cashFlow: 200000,
        committed: 700000,
        completionPercent: 38,
        invoicedToCustomer: 450000,
        receivedPayments: 400000,
        accountsReceivable: 50000,
        accountsPayable: 20000,
        paidToSuppliers: 280000,
        estimateTotal: 1050000,
      },
    };
    const result = useProjectFinancials(projectWithComputed, undefined);
    expect(result.contractAmount).toBe(1300000);
    expect(result.plannedBudget).toBe(1100000);
    expect(result.actualCost).toBe(500000);
    expect(result.margin).toBe(800000);
  });

  it('returns zeros when both project and financials are undefined', () => {
    const result = useProjectFinancials(undefined, undefined);
    expect(result.contractAmount).toBe(0);
    expect(result.plannedBudget).toBe(0);
    expect(result.actualCost).toBe(0);
    expect(result.margin).toBe(0);
    expect(result.profitabilityPct).toBe(0);
    expect(result.budgetUtilPct).toBe(0);
    expect(result.cashFlow).toBe(0);
    expect(result.committed).toBe(0);
    expect(result.completionPct).toBe(0);
    expect(result.remaining).toBe(0);
  });

  it('computes budgetUtilPct from actualCost/plannedBudget when not provided', () => {
    const project: Project = { ...baseProject, budget: 2000000, spentAmount: 800000 };
    const result = useProjectFinancials(project, undefined);
    // budgetUtilPct = (800000 / 2000000) * 100 = 40
    expect(result.budgetUtilPct).toBe(40);
  });

  it('budgetUtilPct is 0 when plannedBudget is 0', () => {
    const project: Project = { ...baseProject, budget: 0, spentAmount: 0 };
    const result = useProjectFinancials(project, undefined);
    expect(result.budgetUtilPct).toBe(0);
  });

  it('computes margin as contractAmount - actualCost when not provided', () => {
    const project: Project = { ...baseProject, contractAmount: 500000, spentAmount: 200000 };
    const result = useProjectFinancials(project, undefined);
    expect(result.margin).toBe(300000);
  });

  it('daysRemaining is non-negative', () => {
    const pastProject: Project = { ...baseProject, plannedEndDate: '2020-01-01' };
    const result = useProjectFinancials(pastProject, undefined);
    expect(result.daysRemaining).toBe(0);
  });

  it('daysRemaining is positive for future date', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const project: Project = { ...baseProject, plannedEndDate: futureDate.toISOString().split('T')[0]! };
    const result = useProjectFinancials(project, undefined);
    expect(result.daysRemaining).toBeGreaterThanOrEqual(29);
    expect(result.daysRemaining).toBeLessThanOrEqual(31);
  });
});
