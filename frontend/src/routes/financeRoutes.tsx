import React, { lazy } from 'react';
import { Navigate, Route, useParams } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';

// Budgets / FM
const FinancialModelsPage = lazy(() => import('@/modules/finance/FinancialModelsPage'));
const BudgetListPage = lazy(() => import('@/modules/finance/BudgetListPage'));
const BudgetDetailPage = lazy(() => import('@/modules/finance/BudgetDetailPage'));
const BudgetFormPage = lazy(() => import('@/modules/finance/BudgetFormPage'));
const FmPage = lazy(() => import('@/modules/finance/FmPage'));
const FmDashboardPage = lazy(() => import('@/modules/finance/FmDashboardPage'));
const CommercialProposalListPage = lazy(() => import('@/modules/commercialProposal/CommercialProposalListPage'));
const CommercialProposalCreatePage = lazy(() => import('@/modules/commercialProposal/CommercialProposalCreatePage'));
const CommercialProposalDetailPage = lazy(() => import('@/modules/commercialProposal/CommercialProposalDetailPage'));

// Invoices
const InvoiceListPage = lazy(() => import('@/modules/finance/InvoiceListPage'));
const InvoiceDetailPage = lazy(() => import('@/modules/finance/InvoiceDetailPage'));
const InvoiceFormPage = lazy(() => import('@/modules/finance/InvoiceFormPage'));

// Payments
const PaymentListPage = lazy(() => import('@/modules/finance/PaymentListPage'));
const PaymentDetailPage = lazy(() => import('@/modules/finance/PaymentDetailPage'));
const PaymentFormPage = lazy(() => import('@/modules/finance/PaymentFormPage'));

// Cash Flow
const CashFlowPage = lazy(() => import('@/modules/finance/CashFlowPage'));
const CashFlowChartPage = lazy(() => import('@/modules/finance/CashFlowChartPage'));

// Bank Statement / Factoring / Treasury / Tax / Export
const BankStatementMatchingPage = lazy(() => import('@/modules/finance/BankStatementMatchingPage'));
const FactoringCalculatorPage = lazy(() => import('@/modules/finance/FactoringCalculatorPage'));
const TreasuryCalendarPage = lazy(() => import('@/modules/finance/TreasuryCalendarPage'));
const TaxCalendarPage = lazy(() => import('@/modules/finance/TaxCalendarPage'));
const BankExportPage = lazy(() => import('@/modules/finance/BankExportPage'));

// Financing Schedule
const FinancingSchedulePage = lazy(() => import('@/modules/finance/FinancingSchedulePage'));

// Execution Chain
const ExecutionChainPage = lazy(() => import('@/modules/finance/ExecutionChainPage'));

// Accounting
const AccountingDashboardPage = lazy(() => import('@/modules/accounting/AccountingDashboardPage'));
const ChartOfAccountsPage = lazy(() => import('@/modules/accounting/ChartOfAccountsPage'));
const FinancialJournalsPage = lazy(() => import('@/modules/accounting/FinancialJournalsPage'));
const JournalEntriesPage = lazy(() => import('@/modules/accounting/JournalEntriesPage'));
const JournalEntryFormPage = lazy(() => import('@/modules/accounting/JournalEntryFormPage'));
const JournalEntryDetailPage = lazy(() => import('@/modules/accounting/JournalEntryDetailPage'));
const FixedAssetsPage = lazy(() => import('@/modules/accounting/FixedAssetsPage'));

// Cost Management
const CostCodeListPage = lazy(() => import('@/modules/costManagement/CostCodeListPage'));
const CostBudgetOverviewPage = lazy(() => import('@/modules/costManagement/BudgetOverviewPage'));
const CommitmentsPage = lazy(() => import('@/modules/costManagement/CommitmentsPage'));
const CommitmentDetailPage = lazy(() => import('@/modules/costManagement/CommitmentDetailPage'));
const CommitmentFormPage = lazy(() => import('@/modules/costManagement/CommitmentFormPage'));
const ForecastPage = lazy(() => import('@/modules/costManagement/ForecastPage'));
const CostCashflowPage = lazy(() => import('@/modules/costManagement/CostCashflowPage'));

// Revenue Recognition
const RevenueContractsPage = lazy(() => import('@/modules/revenueRecognition/RevenueContractListPage'));
const RevenueContractDetailPage = lazy(() => import('@/modules/revenueRecognition/RevenueContractDetailPage'));
const RevenuePeriodsPage = lazy(() => import('@/modules/revenueRecognition/RevenuePeriodsPage'));
const RevenueDashboardPage = lazy(() => import('@/modules/revenueRecognition/RevenueDashboardPage'));

// Vendor Prequalification
const VendorPrequalificationPage = lazy(() => import('@/modules/procurement/VendorPrequalificationPage'));

// Procurement
const PurchaseRequestListPage = lazy(() => import('@/modules/procurement/PurchaseRequestListPage'));
const PurchaseRequestDetailPage = lazy(() => import('@/modules/procurement/PurchaseRequestDetailPage'));
const PurchaseRequestFormPage = lazy(() => import('@/modules/procurement/PurchaseRequestFormPage'));
const PurchaseRequestBoardPage = lazy(() => import('@/modules/procurement/PurchaseRequestBoardPage'));
const PurchaseOrderListPage = lazy(() => import('@/modules/procurement/PurchaseOrderListPage'));
const PurchaseOrderDetailPage = lazy(() => import('@/modules/procurement/PurchaseOrderDetailPage'));
const PurchaseOrderFormPage = lazy(() => import('@/modules/procurement/PurchaseOrderFormPage'));

// Price Coefficients
const PriceCoefficientListPage = lazy(() => import('@/modules/priceCoefficients/PriceCoefficientListPage'));
const PriceCoefficientDetailPage = lazy(() => import('@/modules/priceCoefficients/PriceCoefficientDetailPage'));
const PriceCoefficientFormPage = lazy(() => import('@/modules/priceCoefficients/PriceCoefficientFormPage'));

// Payroll
const PayrollTemplateListPage = lazy(() => import('@/modules/payroll/PayrollTemplateListPage'));
const PayrollTemplateFormPage = lazy(() => import('@/modules/payroll/PayrollTemplateFormPage'));
const PayrollCalculationPage = lazy(() => import('@/modules/payroll/PayrollCalculationPage'));

// Self-Employed
const SelfEmployedContractorListPage = lazy(() => import('@/modules/selfEmployed/ContractorListPage'));
const SelfEmployedContractorFormPage = lazy(() => import('@/modules/selfEmployed/ContractorFormPage'));
const SelfEmployedDetailPage = lazy(() => import('@/modules/selfEmployed/SelfEmployedDetailPage'));
const SelfEmployedPaymentListPage = lazy(() => import('@/modules/selfEmployed/PaymentListPage'));
const SelfEmployedRegistryListPage = lazy(() => import('@/modules/selfEmployed/RegistryListPage'));
const CompletionActFormPage = lazy(() => import('@/modules/selfEmployed/CompletionActFormPage'));

// Tax Risk
const TaxRiskListPage = lazy(() => import('@/modules/taxRisk/TaxRiskListPage'));
const TaxRiskDetailPage = lazy(() => import('@/modules/taxRisk/TaxRiskDetailPage'));
const TaxRiskFormPage = lazy(() => import('@/modules/taxRisk/TaxRiskFormPage'));

// Additional Finance pages
const BddsPage = lazy(() => import('@/modules/finance/BddsPage'));
const CostCodeBrowserPage = lazy(() => import('@/modules/finance/CostCodeBrowserPage'));
const FinanceExpensesPage = lazy(() => import('@/modules/finance/FinanceExpensesPage'));
const SCurveCashFlowPage = lazy(() => import('@/modules/finance/SCurveCashFlowPage'));

// Additional Cost Management pages
const CashFlowForecastPage = lazy(() => import('@/modules/costManagement/CashFlowForecastPage'));
const CostCodeDetailPage = lazy(() => import('@/modules/costManagement/CostCodeDetailPage'));
const ForecastingHubPage = lazy(() => import('@/modules/costManagement/ForecastingHubPage'));
const ProfitabilityDashboardPage = lazy(() => import('@/modules/costManagement/ProfitabilityDashboardPage'));

// Additional Revenue Recognition pages
const RecognitionPeriodPage = lazy(() => import('@/modules/revenueRecognition/RecognitionPeriodPage'));
const RevenueAllContractsPage = lazy(() => import('@/modules/revenueRecognition/RevenueContractsPage'));

// Additional Procurement pages
const BidComparisonPage = lazy(() => import('@/modules/procurement/BidComparisonPage'));
const TendersPage = lazy(() => import('@/modules/procurement/TendersPage'));

// Monte Carlo
const SimulationListPage = lazy(() => import('@/modules/monteCarlo/SimulationListPage'));
const SimulationDetailPage = lazy(() => import('@/modules/monteCarlo/SimulationDetailPage'));
const SimulationFormPage = lazy(() => import('@/modules/monteCarlo/SimulationFormPage'));

const FINANCE_ROLES = ['ADMIN', 'PROJECT_MANAGER', 'MANAGER', 'ACCOUNTANT', 'FINANCE_MANAGER', 'FINANCIAL_CONTROLLER'] as const;
const BUDGET_ROLES = ['ADMIN', 'PROJECT_MANAGER', 'MANAGER', 'COST_MANAGER', 'FINANCE_MANAGER', 'FINANCIAL_CONTROLLER'] as const;

const BudgetRootRedirect: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  if (!id) {
    return <Navigate to="/budgets" replace />;
  }
  return <Navigate to={`/budgets/${id}`} replace />;
};

export function financeRoutes() {
  return (
    <>
      {/* Finance root */}
      <Route path="finance" element={<Navigate to="/budgets" replace />} />

      {/* Budgets (MANAGER+) */}
      <Route path="financial-models" element={<ProtectedRoute requiredRoles={[...BUDGET_ROLES]}><FinancialModelsPage /></ProtectedRoute>} />
      <Route path="budgets" element={<ProtectedRoute requiredRoles={[...BUDGET_ROLES]}><BudgetListPage /></ProtectedRoute>} />
      <Route path="budgets/new" element={<ProtectedRoute requiredRoles={[...BUDGET_ROLES]}><BudgetFormPage /></ProtectedRoute>} />
      <Route path="budgets/:id" element={<ProtectedRoute requiredRoles={[...BUDGET_ROLES]}><BudgetDetailPage /></ProtectedRoute>} />
      <Route path="budgets/:id/overview" element={<ProtectedRoute requiredRoles={[...BUDGET_ROLES]}><BudgetRootRedirect /></ProtectedRoute>} />
      <Route path="budgets/:id/edit" element={<ProtectedRoute requiredRoles={[...BUDGET_ROLES]}><BudgetFormPage /></ProtectedRoute>} />
      <Route path="budgets/:id/fm" element={<ProtectedRoute requiredRoles={[...BUDGET_ROLES]}><FmPage /></ProtectedRoute>} />
      <Route path="budgets/:id/dashboard" element={<ProtectedRoute requiredRoles={[...BUDGET_ROLES]}><FmDashboardPage /></ProtectedRoute>} />
      <Route path="commercial-proposals" element={<ProtectedRoute requiredRoles={[...BUDGET_ROLES]}><CommercialProposalListPage /></ProtectedRoute>} />
      <Route path="commercial-proposals/new" element={<ProtectedRoute requiredRoles={[...BUDGET_ROLES]}><CommercialProposalCreatePage /></ProtectedRoute>} />
      <Route path="commercial-proposals/:id" element={<ProtectedRoute requiredRoles={[...BUDGET_ROLES]}><CommercialProposalDetailPage /></ProtectedRoute>} />

      {/* Invoices (FINANCE+) */}
      <Route path="invoices" element={<ProtectedRoute requiredRoles={[...FINANCE_ROLES]}><InvoiceListPage /></ProtectedRoute>} />
      <Route path="invoices/new" element={<ProtectedRoute requiredRoles={[...FINANCE_ROLES]}><InvoiceFormPage /></ProtectedRoute>} />
      <Route path="invoices/:id" element={<ProtectedRoute requiredRoles={[...FINANCE_ROLES]}><InvoiceDetailPage /></ProtectedRoute>} />
      <Route path="invoices/:id/edit" element={<ProtectedRoute requiredRoles={[...FINANCE_ROLES]}><InvoiceFormPage /></ProtectedRoute>} />

      {/* Payments (FINANCE+) */}
      <Route path="payments" element={<ProtectedRoute requiredRoles={[...FINANCE_ROLES]}><PaymentListPage /></ProtectedRoute>} />
      <Route path="payments/new" element={<ProtectedRoute requiredRoles={[...FINANCE_ROLES]}><PaymentFormPage /></ProtectedRoute>} />
      <Route path="payments/:id" element={<ProtectedRoute requiredRoles={[...FINANCE_ROLES]}><PaymentDetailPage /></ProtectedRoute>} />
      <Route path="payments/:id/edit" element={<ProtectedRoute requiredRoles={[...FINANCE_ROLES]}><PaymentFormPage /></ProtectedRoute>} />

      {/* Cash Flow (FINANCE+) */}
      <Route path="cash-flow" element={<ProtectedRoute requiredRoles={[...FINANCE_ROLES]}><CashFlowPage /></ProtectedRoute>} />
      <Route path="cash-flow/charts" element={<ProtectedRoute requiredRoles={[...FINANCE_ROLES]}><CashFlowChartPage /></ProtectedRoute>} />

      {/* Bank Statement Matching (FINANCE+) */}
      <Route path="bank-statement-matching" element={<ProtectedRoute requiredRoles={[...FINANCE_ROLES]}><BankStatementMatchingPage /></ProtectedRoute>} />

      {/* Factoring Calculator (FINANCE+) */}
      <Route path="factoring-calculator" element={<ProtectedRoute requiredRoles={[...FINANCE_ROLES]}><FactoringCalculatorPage /></ProtectedRoute>} />

      {/* Treasury Calendar (FINANCE+) */}
      <Route path="treasury-calendar" element={<ProtectedRoute requiredRoles={[...FINANCE_ROLES]}><TreasuryCalendarPage /></ProtectedRoute>} />

      {/* Tax Calendar (FINANCE+) */}
      <Route path="tax-calendar" element={<ProtectedRoute requiredRoles={[...FINANCE_ROLES]}><TaxCalendarPage /></ProtectedRoute>} />

      {/* Bank Export (FINANCE+) */}
      <Route path="bank-export" element={<ProtectedRoute requiredRoles={[...FINANCE_ROLES]}><BankExportPage /></ProtectedRoute>} />

      {/* Financing Schedule */}
      <Route path="financing-schedule" element={<ProtectedRoute requiredRoles={[...FINANCE_ROLES]}><FinancingSchedulePage /></ProtectedRoute>} />

      {/* Execution Chain — cross-cutting Estimate→Budget→KS-2→Invoice→Payment */}
      <Route path="execution-chain" element={<ProtectedRoute requiredRoles={[...FINANCE_ROLES]}><ExecutionChainPage /></ProtectedRoute>} />

      {/* Accounting (FINANCE+) */}
      <Route path="accounting" element={<ProtectedRoute requiredRoles={[...FINANCE_ROLES]}><AccountingDashboardPage /></ProtectedRoute>} />
      <Route path="accounting/dashboard" element={<ProtectedRoute requiredRoles={[...FINANCE_ROLES]}><AccountingDashboardPage /></ProtectedRoute>} />
      <Route path="accounting/chart" element={<ProtectedRoute requiredRoles={[...FINANCE_ROLES]}><ChartOfAccountsPage /></ProtectedRoute>} />
      <Route path="accounting/chart-of-accounts" element={<ProtectedRoute requiredRoles={[...FINANCE_ROLES]}><ChartOfAccountsPage /></ProtectedRoute>} />
      <Route path="accounting/journals" element={<ProtectedRoute requiredRoles={[...FINANCE_ROLES]}><FinancialJournalsPage /></ProtectedRoute>} />
      <Route path="accounting/journal" element={<ProtectedRoute requiredRoles={[...FINANCE_ROLES]}><JournalEntriesPage /></ProtectedRoute>} />
      <Route path="accounting/journal/new" element={<ProtectedRoute requiredRoles={[...FINANCE_ROLES]}><JournalEntryFormPage /></ProtectedRoute>} />
      <Route path="accounting/journal/:id" element={<ProtectedRoute requiredRoles={[...FINANCE_ROLES]}><JournalEntryDetailPage /></ProtectedRoute>} />
      <Route path="accounting/journal/:id/edit" element={<ProtectedRoute requiredRoles={[...FINANCE_ROLES]}><JournalEntryFormPage /></ProtectedRoute>} />
      <Route path="accounting/assets" element={<ProtectedRoute requiredRoles={[...FINANCE_ROLES]}><FixedAssetsPage /></ProtectedRoute>} />

      {/* Cost Management */}
      <Route path="cost-management/codes" element={<CostCodeListPage />} />
      <Route path="cost-management/budget" element={<CostBudgetOverviewPage />} />
      <Route path="cost-management/commitments" element={<CommitmentsPage />} />
      <Route path="cost-management/commitments/new" element={<CommitmentFormPage />} />
      <Route path="cost-management/commitments/:id" element={<CommitmentDetailPage />} />
      <Route path="cost-management/commitments/:id/edit" element={<CommitmentFormPage />} />
      <Route path="cost-management/forecast" element={<ForecastPage />} />
      <Route path="cost-management/cashflow" element={<CostCashflowPage />} />

      {/* Revenue Recognition */}
      <Route path="revenue/contracts" element={<RevenueContractsPage />} />
      <Route path="revenue/contracts/:id" element={<RevenueContractDetailPage />} />
      <Route path="revenue/periods" element={<RevenuePeriodsPage />} />
      <Route path="revenue/dashboard" element={<RevenueDashboardPage />} />

      {/* Procurement */}
      <Route path="procurement" element={<PurchaseRequestListPage />} />
      <Route path="procurement/purchase-orders" element={<PurchaseOrderListPage />} />
      <Route path="procurement/purchase-orders/new" element={<PurchaseOrderFormPage />} />
      <Route path="procurement/purchase-orders/:id" element={<PurchaseOrderDetailPage />} />
      <Route path="procurement/board" element={<PurchaseRequestBoardPage />} />
      <Route path="procurement/new" element={<PurchaseRequestFormPage />} />
      <Route path="procurement/:id" element={<PurchaseRequestDetailPage />} />
      <Route path="procurement/:id/edit" element={<PurchaseRequestFormPage />} />
      <Route path="procurement/prequalification" element={<VendorPrequalificationPage />} />

      {/* Price Coefficients */}
      <Route path="price-coefficients" element={<PriceCoefficientListPage />} />
      <Route path="price-coefficients/new" element={<PriceCoefficientFormPage />} />
      <Route path="price-coefficients/:id" element={<PriceCoefficientDetailPage />} />
      <Route path="price-coefficients/:id/edit" element={<PriceCoefficientFormPage />} />

      {/* Payroll */}
      <Route path="payroll" element={<PayrollTemplateListPage />} />
      <Route path="payroll/templates/new" element={<PayrollTemplateFormPage />} />
      <Route path="payroll/templates/:id/edit" element={<PayrollTemplateFormPage />} />
      <Route path="payroll/calculate" element={<PayrollCalculationPage />} />

      {/* Self-Employed */}
      <Route path="self-employed" element={<SelfEmployedContractorListPage />} />
      <Route path="self-employed/new" element={<SelfEmployedContractorFormPage />} />
      <Route path="self-employed/:id" element={<SelfEmployedDetailPage />} />
      <Route path="self-employed/:id/edit" element={<SelfEmployedContractorFormPage />} />
      <Route path="self-employed/contractors/new" element={<SelfEmployedContractorFormPage />} />
      <Route path="self-employed/contractors/:id/edit" element={<SelfEmployedContractorFormPage />} />
      <Route path="self-employed/acts/new" element={<CompletionActFormPage />} />
      <Route path="self-employed/payments" element={<SelfEmployedPaymentListPage />} />
      <Route path="self-employed/registries" element={<SelfEmployedRegistryListPage />} />

      {/* Tax Risk */}
      <Route path="tax-risk" element={<TaxRiskListPage />} />
      <Route path="tax-risk/new" element={<TaxRiskFormPage />} />
      <Route path="tax-risk/:id" element={<TaxRiskDetailPage />} />
      <Route path="tax-risk/:id/edit" element={<TaxRiskFormPage />} />

      {/* Monte Carlo */}
      <Route path="monte-carlo" element={<SimulationListPage />} />
      <Route path="monte-carlo/new" element={<SimulationFormPage />} />
      <Route path="monte-carlo/:id" element={<SimulationDetailPage />} />
      <Route path="monte-carlo/:id/edit" element={<SimulationFormPage />} />

      {/* BDDS / Cost Codes / Expenses / S-Curve */}
      <Route path="bdds" element={<BddsPage />} />
      <Route path="cost-codes" element={<CostCodeBrowserPage />} />
      <Route path="finance/expenses" element={<FinanceExpensesPage />} />
      <Route path="finance/s-curve-cashflow" element={<SCurveCashFlowPage />} />

      {/* Additional Cost Management */}
      <Route path="cost-management/cashflow-forecast" element={<CashFlowForecastPage />} />
      <Route path="cost-management/codes/:id" element={<CostCodeDetailPage />} />
      <Route path="cost-management/forecasting-hub" element={<ForecastingHubPage />} />
      <Route path="cost-management/profitability" element={<ProfitabilityDashboardPage />} />

      {/* Additional Revenue Recognition */}
      <Route path="revenue/recognition-periods" element={<RecognitionPeriodPage />} />
      <Route path="revenue/all-contracts" element={<RevenueAllContractsPage />} />

      {/* Additional Procurement */}
      <Route path="procurement/bid-comparison" element={<BidComparisonPage />} />
      <Route path="procurement/tenders" element={<TendersPage />} />

      {/* Legacy deep-link aliases from old /finance/* URLs */}
      <Route path="finance/budgets" element={<Navigate to="/budgets" replace />} />
      <Route path="finance/budgets/new" element={<Navigate to="/budgets/new" replace />} />
      <Route path="finance/budgets/:id" element={<ProtectedRoute requiredRoles={[...BUDGET_ROLES]}><BudgetRootRedirect /></ProtectedRoute>} />
      <Route path="finance/budgets/:id/edit" element={<ProtectedRoute requiredRoles={[...BUDGET_ROLES]}><BudgetFormPage /></ProtectedRoute>} />
      <Route path="finance/budgets/:id/fm" element={<ProtectedRoute requiredRoles={[...BUDGET_ROLES]}><FmPage /></ProtectedRoute>} />
      <Route path="finance/commercial-proposals" element={<Navigate to="/commercial-proposals" replace />} />
      <Route path="finance/commercial-proposals/new" element={<Navigate to="/commercial-proposals/new" replace />} />
      <Route path="finance/commercial-proposals/:id" element={<ProtectedRoute requiredRoles={[...BUDGET_ROLES]}><CommercialProposalDetailPage /></ProtectedRoute>} />
      <Route path="finance/contracts" element={<Navigate to="/contracts" replace />} />
      <Route path="finance/estimates" element={<Navigate to="/estimates" replace />} />
      <Route path="finance/specifications" element={<Navigate to="/specifications" replace />} />
      <Route path="finance/invoices" element={<Navigate to="/invoices" replace />} />
      <Route path="finance/invoices/new" element={<Navigate to="/invoices/new" replace />} />
      <Route path="finance/invoices/:id" element={<ProtectedRoute requiredRoles={[...FINANCE_ROLES]}><InvoiceDetailPage /></ProtectedRoute>} />
      <Route path="finance/payments" element={<Navigate to="/payments" replace />} />
      <Route path="finance/payments/new" element={<Navigate to="/payments/new" replace />} />
      <Route path="finance/payments/:id" element={<ProtectedRoute requiredRoles={[...FINANCE_ROLES]}><PaymentDetailPage /></ProtectedRoute>} />
    </>
  );
}
