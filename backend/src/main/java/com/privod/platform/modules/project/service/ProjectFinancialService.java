package com.privod.platform.modules.project.service;

import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.contract.repository.ContractRepository;
import com.privod.platform.modules.costManagement.repository.CostCodeRepository;
import com.privod.platform.modules.costManagement.repository.CommitmentRepository;
import com.privod.platform.modules.estimate.repository.EstimateRepository;
import com.privod.platform.modules.finance.domain.InvoiceType;
import com.privod.platform.modules.finance.domain.PaymentType;
import com.privod.platform.modules.finance.repository.BudgetRepository;
import com.privod.platform.modules.finance.repository.InvoiceRepository;
import com.privod.platform.modules.finance.repository.PaymentRepository;
import com.privod.platform.modules.project.domain.Project;
import com.privod.platform.modules.project.repository.ProjectRepository;
import com.privod.platform.modules.project.web.dto.ProjectFinancialSummary;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;

/**
 * Service that computes all financial metrics for a project by aggregating data
 * from contracts, invoices, payments, cost codes, commitments, budgets, and estimates.
 * <p>
 * All queries use efficient SQL aggregation (COALESCE + SUM) to avoid N+1 issues.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectFinancialService {

    private final ProjectRepository projectRepository;
    private final ContractRepository contractRepository;
    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final CostCodeRepository costCodeRepository;
    private final CommitmentRepository commitmentRepository;
    private final BudgetRepository budgetRepository;
    private final EstimateRepository estimateRepository;

    /** Contract type codes that represent revenue (customer-facing) contracts. */
    private static final List<String> REVENUE_TYPE_CODES = List.of("GENERAL");

    /** Contract type codes for subcontract expenses. */
    private static final List<String> SUBCONTRACT_TYPE_CODES = List.of("SUBCONTRACT");

    /** Contract type codes for supply expenses. */
    private static final List<String> SUPPLY_TYPE_CODES = List.of("SUPPLY");

    /** Contract type codes for service expenses. */
    private static final List<String> SERVICE_TYPE_CODES = List.of("SERVICE");

    /**
     * Compute the full financial summary for a project.
     * Uses efficient SQL aggregation queries -- one query per metric group.
     *
     * @param projectId the project UUID
     * @return fully computed ProjectFinancialSummary
     * @throws EntityNotFoundException if project does not exist
     */
    @Transactional(readOnly = true)
    public ProjectFinancialSummary getFinancials(UUID projectId) {
        Project project = projectRepository.findById(projectId)
                .filter(p -> !p.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Project not found with id: " + projectId));

        UUID currentOrgId = SecurityUtils.getCurrentOrganizationId()
                .orElseThrow(() -> new AccessDeniedException("Organization context is required"));

        if (project.getOrganizationId() == null || !project.getOrganizationId().equals(currentOrgId)) {
            // Avoid leaking cross-tenant existence.
            throw new EntityNotFoundException("Project not found with id: " + projectId);
        }

        // --- Revenue side: contracts with customer ---
        BigDecimal contractAmount = contractRepository
                .sumAmountByProjectIdAndTypeCodes(projectId, REVENUE_TYPE_CODES);

        // --- Expense side: subcontract, supply, service contracts ---
        BigDecimal subcontractAmount = contractRepository
                .sumAmountByProjectIdAndTypeCodes(projectId, SUBCONTRACT_TYPE_CODES);
        BigDecimal supplyAmount = contractRepository
                .sumAmountByProjectIdAndTypeCodes(projectId, SUPPLY_TYPE_CODES);
        BigDecimal serviceAmount = contractRepository
                .sumAmountByProjectIdAndTypeCodes(projectId, SERVICE_TYPE_CODES);

        // --- Invoices ---
        BigDecimal invoicedToCustomer = invoiceRepository
                .sumTotalByProjectIdAndType(projectId, InvoiceType.ISSUED);
        BigDecimal invoicedFromSuppliers = invoiceRepository
                .sumTotalByProjectIdAndType(projectId, InvoiceType.RECEIVED);

        // --- Payments ---
        BigDecimal receivedPayments = paymentRepository
                .sumTotalByProjectIdAndType(projectId, PaymentType.INCOMING);
        BigDecimal paidToSuppliers = paymentRepository
                .sumTotalByProjectIdAndType(projectId, PaymentType.OUTGOING);

        // --- Planned budget ---
        // Primary source: cost code budget amounts; fallback to budget entity plannedCost
        BigDecimal costCodeBudget = costCodeRepository.sumBudgetAmountByProjectId(projectId);
        BigDecimal budgetPlannedCost = budgetRepository.sumPlannedCostByProjectId(projectId);
        BigDecimal plannedBudget = costCodeBudget.compareTo(BigDecimal.ZERO) > 0
                ? costCodeBudget
                : budgetPlannedCost;

        // --- Estimates ---
        BigDecimal estimateTotal = estimateRepository.sumTotalAmountByProjectId(projectId);

        // --- Commitments (signed subcontracts + POs) ---
        BigDecimal committed = commitmentRepository.sumRevisedAmountByProjectId(projectId);

        // --- Derived calculations ---
        BigDecimal accountsReceivable = invoicedToCustomer.subtract(receivedPayments);
        BigDecimal accountsPayable = invoicedFromSuppliers.subtract(paidToSuppliers);
        BigDecimal actualCost = paidToSuppliers;
        BigDecimal margin = contractAmount.subtract(actualCost);

        BigDecimal profitabilityPercent = safeDividePercent(margin, contractAmount);
        BigDecimal budgetUtilizationPercent = safeDividePercent(actualCost, plannedBudget);
        BigDecimal cashFlow = receivedPayments.subtract(paidToSuppliers);
        BigDecimal completionPercent = safeDividePercent(actualCost, contractAmount);

        log.debug("Financial summary computed for project {}: contractAmount={}, actualCost={}, margin={}",
                projectId, contractAmount, actualCost, margin);

        return new ProjectFinancialSummary(
                projectId,
                // Revenue side
                contractAmount,
                invoicedToCustomer,
                receivedPayments,
                accountsReceivable,
                // Expense side
                plannedBudget,
                estimateTotal,
                committed,
                subcontractAmount,
                supplyAmount,
                serviceAmount,
                invoicedFromSuppliers,
                paidToSuppliers,
                accountsPayable,
                actualCost,
                // Derived metrics
                margin,
                profitabilityPercent,
                budgetUtilizationPercent,
                cashFlow,
                completionPercent,
                // Preliminary (manual) values
                project.getBudgetAmount() != null ? project.getBudgetAmount() : BigDecimal.ZERO,
                project.getContractAmount() != null ? project.getContractAmount() : BigDecimal.ZERO
        );
    }

    /**
     * Compute aggregated financial totals across all active (non-cancelled, non-deleted) projects.
     * Used by the dashboard summary endpoint.
     *
     * @param projectIds list of project IDs to aggregate; if null or empty, returns zeros
     * @return a summary with totals
     */
    @Transactional(readOnly = true)
    public DashboardFinancialTotals getDashboardTotals(List<UUID> projectIds) {
        if (projectIds == null || projectIds.isEmpty()) {
            return DashboardFinancialTotals.ZERO;
        }

        BigDecimal totalContractAmount = BigDecimal.ZERO;
        BigDecimal totalPlannedBudget = BigDecimal.ZERO;
        BigDecimal totalActualCost = BigDecimal.ZERO;
        BigDecimal totalReceivedPayments = BigDecimal.ZERO;
        BigDecimal totalPaidToSuppliers = BigDecimal.ZERO;

        for (UUID projectId : projectIds) {
            totalContractAmount = totalContractAmount.add(
                    contractRepository.sumAmountByProjectIdAndTypeCodes(projectId, REVENUE_TYPE_CODES));

            BigDecimal ccBudget = costCodeRepository.sumBudgetAmountByProjectId(projectId);
            BigDecimal budgetPC = budgetRepository.sumPlannedCostByProjectId(projectId);
            totalPlannedBudget = totalPlannedBudget.add(
                    ccBudget.compareTo(BigDecimal.ZERO) > 0 ? ccBudget : budgetPC);

            totalReceivedPayments = totalReceivedPayments.add(
                    paymentRepository.sumTotalByProjectIdAndType(projectId, PaymentType.INCOMING));
            totalPaidToSuppliers = totalPaidToSuppliers.add(
                    paymentRepository.sumTotalByProjectIdAndType(projectId, PaymentType.OUTGOING));
        }
        totalActualCost = totalPaidToSuppliers;

        return new DashboardFinancialTotals(
                totalContractAmount,
                totalPlannedBudget,
                totalActualCost,
                totalReceivedPayments,
                totalPaidToSuppliers,
                totalReceivedPayments.subtract(totalPaidToSuppliers)
        );
    }

    /**
     * Safely divide numerator / denominator * 100, returning ZERO when denominator is zero.
     */
    private BigDecimal safeDividePercent(BigDecimal numerator, BigDecimal denominator) {
        if (denominator == null || denominator.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return numerator
                .multiply(BigDecimal.valueOf(100))
                .divide(denominator, 2, RoundingMode.HALF_UP);
    }

    /**
     * Aggregated financial totals for dashboard.
     */
    public record DashboardFinancialTotals(
            BigDecimal totalContractAmount,
            BigDecimal totalPlannedBudget,
            BigDecimal totalActualCost,
            BigDecimal totalReceivedPayments,
            BigDecimal totalPaidToSuppliers,
            BigDecimal totalCashFlow
    ) {
        public static final DashboardFinancialTotals ZERO = new DashboardFinancialTotals(
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO
        );
    }
}
