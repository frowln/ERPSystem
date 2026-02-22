import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as XLSX from 'xlsx';
import { t } from '@/i18n';
import { contractsApi } from '@/api/contracts';
import { financeApi } from '@/api/finance';
import { formatMoneyWhole } from '@/lib/format';
import type { Project, ProjectFinancialSummary, Contract, FinanceExpenseItem } from '@/types';
import type { ComputedFinancials } from '../hooks/useProjectFinancials';
import type { ProjectBudgetItem, BudgetTreeNode } from './types';
import { CONTRACT_TYPE_LABELS } from './types';
import { fetchContractTypes, fetchChangeOrders } from './helpers';
import { BudgetPositionsSection } from './BudgetPositionsSection';
import { ContractsBreakdownSection } from './ContractsBreakdownSection';
import { MarginSummarySection } from './MarginSummarySection';
import { FinanceMetricCards } from './FinanceMetricCards';
import { PaymentsSection } from './PaymentsSection';

interface Props {
  project: Project | undefined;
  financials: ProjectFinancialSummary | undefined;
  computed: ComputedFinancials;
  financialsLoading: boolean;
}

export const ProjectFinanceTab: React.FC<Props> = ({
  project: p, financials: fin, computed: f, financialsLoading,
}) => {
  const [expandedContractRows, setExpandedContractRows] = useState<Set<string>>(new Set());
  const [expandedBudgetRows, setExpandedBudgetRows] = useState<Set<string>>(new Set());

  // ── Budget positions for this project ─────────────────────────────────────
  const { data: expensesData, isLoading: expensesLoading } = useQuery({
    queryKey: ['project-budget-expenses', p?.id],
    queryFn: () => financeApi.getExpenses({ projectId: p!.id, size: 2000 }),
    enabled: !!p?.id,
  });
  const budgetPositions = useMemo<FinanceExpenseItem[]>(
    () => expensesData?.content ?? [],
    [expensesData],
  );

  const { data: budgetsData, isLoading: budgetsLoading } = useQuery({
    queryKey: ['project-budgets-fin', p?.id],
    queryFn: () => financeApi.getBudgets({ projectId: p!.id, page: 0, size: 200 }),
    enabled: !!p?.id,
  });
  const projectBudgets = useMemo(
    () => budgetsData?.content ?? [],
    [budgetsData],
  );
  const budgetIdsKey = useMemo(
    () => projectBudgets.map((budget) => budget.id).sort().join(','),
    [projectBudgets],
  );

  const budgetItemsQuery = useQuery({
    queryKey: ['project-budget-items-fin', p?.id, budgetIdsKey],
    queryFn: async () => {
      const bundles = await Promise.all(
        projectBudgets.map(async (budget) => {
          const items = await financeApi.getBudgetItems(budget.id);
          return items.map((item) => ({
            ...item,
            budgetName: budget.name,
            projectId: budget.projectId,
            projectName: budget.projectName,
          } as ProjectBudgetItem));
        }),
      );
      return bundles.flat();
    },
    enabled: !!p?.id && projectBudgets.length > 0,
  });
  const projectBudgetItems = useMemo<ProjectBudgetItem[]>(
    () => (budgetItemsQuery.data ?? []) as ProjectBudgetItem[],
    [budgetItemsQuery.data],
  );
  const budgetItemsLoading = budgetItemsQuery.isLoading;

  const toggleContractRow = useCallback((id: string) =>
    setExpandedContractRows((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    }), []);

  const toggleBudgetRow = useCallback((id: string) =>
    setExpandedBudgetRows((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    }), []);

  // ── Fetch contracts ───────────────────────────────────────────────────────
  const { data: contractsData } = useQuery({
    queryKey: ['project-contracts-fin', p?.id],
    queryFn: () => contractsApi.getContracts({ projectId: p!.id, size: 50 }),
    enabled: !!p?.id,
  });

  const { data: typeCodeMap = {} } = useQuery({
    queryKey: ['contract-type-codes'],
    queryFn: fetchContractTypes,
    staleTime: 10 * 60_000,
  });

  const { data: paymentsData } = useQuery({
    queryKey: ['project-payments', p?.id],
    queryFn: () => financeApi.getPayments({ projectId: p!.id, size: 50, sort: 'paymentDate,desc' }),
    enabled: !!p?.id,
  });

  const { data: issuedInvoicesData } = useQuery({
    queryKey: ['project-issued-invoices', p?.id],
    queryFn: () => financeApi.getInvoices({ projectId: p!.id, invoiceType: 'ISSUED', size: 100 }),
    enabled: !!p?.id,
  });

  const { data: changeOrders = [] } = useQuery({
    queryKey: ['project-change-orders', p?.id],
    queryFn: () => fetchChangeOrders(p!.id),
    enabled: !!p?.id,
  });

  const contracts = contractsData?.content ?? [];
  const payments = paymentsData?.content ?? [];
  const issuedInvoices = issuedInvoicesData?.content ?? [];
  const issuedInvoiceCount = issuedInvoicesData?.totalElements ?? issuedInvoices.length;

  const expenseByItemId = useMemo(
    () => new Map(budgetPositions.map((pos) => [pos.id, pos])),
    [budgetPositions],
  );

  const mergedBudgetItems = useMemo<ProjectBudgetItem[]>(() => (
    projectBudgetItems.map((item): ProjectBudgetItem => {
      const expense = expenseByItemId.get(item.id);
      if (!expense) return item;
      return {
        ...item,
        ...expense,
        budgetId: item.budgetId,
        category: item.category,
        itemType: item.itemType,
        actualAmount: item.actualAmount,
        committedAmount: item.committedAmount,
        remainingAmount: item.remainingAmount,
        budgetName: item.budgetName ?? expense.budgetName,
        projectId: item.projectId ?? expense.projectId,
        projectName: item.projectName ?? expense.projectName,
      };
    })
  ), [projectBudgetItems, expenseByItemId]);

  const budgetItemsByParent = useMemo(() => {
    const map = new Map<string, ProjectBudgetItem[]>();
    for (const item of mergedBudgetItems) {
      if (!item.parentId) continue;
      const bucket = map.get(item.parentId) ?? [];
      bucket.push(item);
      map.set(item.parentId, bucket);
    }
    for (const bucket of map.values()) {
      bucket.sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));
    }
    return map;
  }, [mergedBudgetItems]);

  const budgetRootItems = useMemo(
    () => mergedBudgetItems
      .filter((item) => !item.parentId)
      .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0)),
    [mergedBudgetItems],
  );

  useEffect(() => {
    const roots = budgetRootItems.filter((item) => item.section).map((item) => item.id);
    setExpandedBudgetRows(new Set(roots));
  }, [budgetIdsKey, budgetRootItems]);

  const budgetTree = useMemo<BudgetTreeNode[]>(() => {
    const buildNode = (item: ProjectBudgetItem, visited: Set<string>): BudgetTreeNode => {
      if (visited.has(item.id)) {
        return {
          item,
          children: [],
          totals: { planned: 0, contracted: 0, actSigned: 0, paid: 0 },
        };
      }
      visited.add(item.id);

      const children = (budgetItemsByParent.get(item.id) ?? []).map((child) => buildNode(child, visited));
      visited.delete(item.id);

      if (!item.section) {
        return {
          item,
          children,
          totals: {
            planned: Number(item.plannedAmount ?? 0),
            contracted: Number(item.contractedAmount ?? 0),
            actSigned: Number(item.actSignedAmount ?? 0),
            paid: Number(item.paidAmount ?? 0),
          },
        };
      }

      const totals = children.reduce(
        (acc, child) => ({
          planned: acc.planned + child.totals.planned,
          contracted: acc.contracted + child.totals.contracted,
          actSigned: acc.actSigned + child.totals.actSigned,
          paid: acc.paid + child.totals.paid,
        }),
        { planned: 0, contracted: 0, actSigned: 0, paid: 0 },
      );

      return { item, children, totals };
    };

    return budgetRootItems.map((root) => buildNode(root, new Set<string>()));
  }, [budgetItemsByParent, budgetRootItems]);

  const budgetRows = useMemo(() => {
    const rows: Array<{ node: BudgetTreeNode; depth: number }> = [];
    const visit = (node: BudgetTreeNode, depth: number) => {
      rows.push({ node, depth });
      if (!node.item.section) return;
      if (!expandedBudgetRows.has(node.item.id)) return;
      node.children.forEach((child) => visit(child, depth + 1));
    };
    budgetTree.forEach((root) => visit(root, 0));
    return rows;
  }, [budgetTree, expandedBudgetRows]);

  const budgetTotals = useMemo(
    () => budgetTree.reduce(
      (acc, node) => ({
        planned: acc.planned + node.totals.planned,
        contracted: acc.contracted + node.totals.contracted,
        actSigned: acc.actSigned + node.totals.actSigned,
        paid: acc.paid + node.totals.paid,
      }),
      { planned: 0, contracted: 0, actSigned: 0, paid: 0 },
    ),
    [budgetTree],
  );

  // ── Derived data ──────────────────────────────────────────────────────────
  const getTypeCode = (c: Contract): string => typeCodeMap[c.typeId] ?? '';

  // Classify contracts by direction: CLIENT → Revenue, CONTRACTOR → Expenses
  const revenueContracts = useMemo(
    () => contracts.filter((c) =>
      c.contractDirection === 'CLIENT' || getTypeCode(c) === 'GENERAL'),
    [contracts, typeCodeMap],
  );

  const expenseContracts = useMemo(
    () => contracts.filter((c) =>
      c.contractDirection === 'CONTRACTOR'
      || (c.contractDirection !== 'CLIENT' && getTypeCode(c) !== 'GENERAL')),
    [contracts, typeCodeMap],
  );

  const contractsByType = useMemo(() => {
    const map = new Map<string, Contract[]>();
    expenseContracts.forEach((c) => {
      const code = getTypeCode(c) || 'OTHER';
      if (!map.has(code)) map.set(code, []);
      map.get(code)!.push(c);
    });
    return map;
  }, [expenseContracts, typeCodeMap]);

  const revenueTotals = useMemo(() => ({
    contractAmount: f.contractAmount || revenueContracts.reduce((s, c) => s + (c.amount ?? 0), 0),
    totalWithVat: revenueContracts.reduce((s, c) => s + (c.totalWithVat ?? 0), 0),
    invoiced: f.invoicedToCustomer,
    paid: f.receivedPayments,
    receivable: Math.max(0, f.accountsReceivable),
  }), [revenueContracts, f]);

  const expenseTotals = useMemo(() => ({
    contractAmount: expenseContracts.reduce((s, c) => s + (c.amount ?? 0), 0),
    totalWithVat: expenseContracts.reduce((s, c) => s + (c.totalWithVat ?? 0), 0),
    invoiced: fin?.invoicedFromSuppliers ?? 0,
    paid: f.paidToSuppliers,
    receivable: Math.max(0, f.accountsPayable),
  }), [expenseContracts, f]);

  const plannedMargin = revenueTotals.contractAmount - expenseTotals.contractAmount;
  const plannedMarginPct = revenueTotals.contractAmount > 0
    ? (plannedMargin / revenueTotals.contractAmount) * 100 : 0;

  // ── Excel Export ─────────────────────────────────────────────────────────

  const exportToExcel = useCallback(() => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Financial Summary
    const summaryRows = [
      [t('projects.finance.excelReportTitle'), p?.name ?? ''],
      [t('projects.finance.excelExportDate'), new Date().toLocaleDateString('ru-RU')],
      [],
      [t('projects.finance.excelRevenueFromClient')],
      [t('projects.finance.colContract'), t('projects.finance.colCounterparty'), t('projects.finance.colAmount'), t('projects.finance.colWithVat'), t('projects.finance.colInvoiced'), t('projects.finance.colReceived'), t('projects.finance.colReceivables')],
      ...revenueContracts.map((c) => [
        c.number, c.partnerName ?? '', c.amount, c.totalWithVat,
        f.invoicedToCustomer, f.receivedPayments, Math.max(0, f.accountsReceivable),
      ]),
      [t('projects.finance.excelTotalRevenue'), '', revenueTotals.contractAmount, revenueTotals.totalWithVat,
        revenueTotals.invoiced, revenueTotals.paid, revenueTotals.receivable],
      [],
      [t('projects.finance.excelExpensesByContracts')],
      [t('projects.finance.colContract'), t('projects.finance.colCounterparty'), t('projects.finance.colType'), t('projects.finance.colAmount'), t('projects.finance.colWithVat'), t('projects.finance.colInvoicedBySupplier'), t('projects.finance.colPaid'), t('projects.finance.colPayables')],
      ...expenseContracts.map((c) => [
        c.number, c.partnerName ?? '',
        CONTRACT_TYPE_LABELS[getTypeCode(c)] ?? getTypeCode(c),
        c.amount, c.totalWithVat,
        c.totalInvoiced ?? 0, c.totalPaid ?? 0,
        Math.max(0, (c.totalInvoiced ?? 0) - (c.totalPaid ?? 0)),
      ]),
      [t('projects.finance.excelTotalExpenses'), '', '', expenseTotals.contractAmount, expenseTotals.totalWithVat,
        expenseTotals.invoiced, expenseTotals.paid, expenseTotals.receivable],
      [],
      [t('projects.finance.excelProfitability')],
      [t('projects.finance.excelClientContractAmount'), revenueTotals.contractAmount],
      [t('projects.finance.excelPlannedCosts'), f.plannedBudget],
      [t('projects.finance.excelPlannedMargin'), plannedMargin],
      [t('projects.finance.excelPlannedMarginPct'), (plannedMarginPct / 100).toFixed(4)],
      [t('projects.finance.excelReceivedFromClient'), f.receivedPayments],
      [t('projects.finance.excelPaidToSuppliers'), f.paidToSuppliers],
      [t('projects.finance.excelNetCashFlow'), f.cashFlow],
    ];

    const ws1 = XLSX.utils.aoa_to_sheet(summaryRows);
    ws1['!cols'] = [{ wch: 35 }, { wch: 25 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, ws1, t('projects.finance.excelSheetFinances'));

    // Sheet 2: Payments
    const payRows = [
      [t('projects.finance.excelPaymentsForProject'), p?.name ?? ''],
      [],
      [t('projects.finance.colDate'), t('projects.finance.colNumber'), t('projects.finance.colType'), t('projects.finance.colCounterparty'), t('projects.finance.colAmount'), t('projects.finance.colStatus')],
      ...payments.map((pay) => [
        pay.paymentDate, pay.number,
        pay.paymentType === 'INCOMING' ? t('projects.finance.incoming') : t('projects.finance.outgoing'),
        pay.partnerName ?? '', pay.totalAmount, pay.status,
      ]),
    ];
    const ws2 = XLSX.utils.aoa_to_sheet(payRows);
    ws2['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 30 }, { wch: 18 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, ws2, t('projects.finance.excelSheetPayments'));

    XLSX.writeFile(wb, `${t('projects.finance.excelSheetFinances')}_${p?.code ?? 'project'}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }, [p, revenueContracts, expenseContracts, revenueTotals, expenseTotals, f, plannedMargin, plannedMarginPct, payments, typeCodeMap]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <BudgetPositionsSection
        projectId={p?.id}
        projectName={p?.name}
        budgetPositionsCount={budgetPositions.length}
        budgetRows={budgetRows}
        budgetTotals={budgetTotals}
        expandedBudgetRows={expandedBudgetRows}
        toggleBudgetRow={toggleBudgetRow}
        isLoading={expensesLoading || budgetsLoading || budgetItemsLoading}
      />

      <ContractsBreakdownSection
        projectId={p?.id}
        revenueContracts={revenueContracts}
        expenseContracts={expenseContracts}
        contractsByType={contractsByType}
        changeOrders={changeOrders}
        revenueTotals={revenueTotals}
        expenseTotals={expenseTotals}
        computed={f}
        issuedInvoiceCount={issuedInvoiceCount}
        expandedContractRows={expandedContractRows}
        toggleContractRow={toggleContractRow}
        onExportExcel={exportToExcel}
      />

      <MarginSummarySection
        revenueTotals={revenueTotals}
        expenseTotals={expenseTotals}
        plannedMargin={plannedMargin}
        plannedMarginPct={plannedMarginPct}
        computed={f}
      />

      <FinanceMetricCards
        computed={f}
        financialsLoading={financialsLoading}
      />

      <PaymentsSection
        projectId={p?.id}
        payments={payments}
      />
    </div>
  );
};
