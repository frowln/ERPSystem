package com.privod.platform.modules.project.web.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.privod.platform.modules.project.domain.Project;
import com.privod.platform.modules.project.domain.ProjectPriority;
import com.privod.platform.modules.project.domain.ProjectStatus;
import com.privod.platform.modules.project.domain.ProjectType;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record ProjectResponse(
        UUID id,
        String code,
        String name,
        String description,
        ProjectStatus status,
        String statusDisplayName,
        UUID organizationId,
        UUID customerId,
        UUID managerId,
        LocalDate plannedStartDate,
        LocalDate plannedEndDate,
        LocalDate actualStartDate,
        LocalDate actualEndDate,
        String address,
        String city,
        String region,
        BigDecimal latitude,
        BigDecimal longitude,
        /** Manual (preliminary) budget amount from project entity */
        BigDecimal budgetAmount,
        /** Manual (preliminary) contract amount from project entity */
        BigDecimal contractAmount,
        ProjectType type,
        String category,
        String constructionKind,
        ProjectPriority priority,
        Instant createdAt,
        Instant updatedAt,
        String createdBy,
        /** Computed financial summary; null when not enriched (e.g. in list endpoints) */
        @JsonInclude(JsonInclude.Include.NON_NULL)
        ComputedFinancials computedFinancials
) {
    /**
     * Create a ProjectResponse from the entity without computed financials.
     * Used in list endpoints where per-project financial calculation would be too expensive.
     */
    public static ProjectResponse fromEntity(Project project) {
        return new ProjectResponse(
                project.getId(),
                project.getCode(),
                project.getName(),
                project.getDescription(),
                project.getStatus(),
                project.getStatus().getDisplayName(),
                project.getOrganizationId(),
                project.getCustomerId(),
                project.getManagerId(),
                project.getPlannedStartDate(),
                project.getPlannedEndDate(),
                project.getActualStartDate(),
                project.getActualEndDate(),
                project.getAddress(),
                project.getCity(),
                project.getRegion(),
                project.getLatitude(),
                project.getLongitude(),
                project.getBudgetAmount(),
                project.getContractAmount(),
                project.getType(),
                project.getCategory(),
                project.getConstructionKind(),
                project.getPriority(),
                project.getCreatedAt(),
                project.getUpdatedAt(),
                project.getCreatedBy(),
                null
        );
    }

    /**
     * Create a ProjectResponse enriched with computed financial data.
     * Used in single-project GET endpoint.
     */
    public static ProjectResponse fromEntityWithFinancials(Project project, ProjectFinancialSummary financials) {
        return new ProjectResponse(
                project.getId(),
                project.getCode(),
                project.getName(),
                project.getDescription(),
                project.getStatus(),
                project.getStatus().getDisplayName(),
                project.getOrganizationId(),
                project.getCustomerId(),
                project.getManagerId(),
                project.getPlannedStartDate(),
                project.getPlannedEndDate(),
                project.getActualStartDate(),
                project.getActualEndDate(),
                project.getAddress(),
                project.getCity(),
                project.getRegion(),
                project.getLatitude(),
                project.getLongitude(),
                project.getBudgetAmount(),
                project.getContractAmount(),
                project.getType(),
                project.getCategory(),
                project.getConstructionKind(),
                project.getPriority(),
                project.getCreatedAt(),
                project.getUpdatedAt(),
                project.getCreatedBy(),
                ComputedFinancials.from(financials)
        );
    }

    /**
     * Nested DTO containing the key computed financial fields.
     * Included only in single-project responses (GET /api/projects/{id}).
     */
    public record ComputedFinancials(
            BigDecimal contractAmount,
            BigDecimal invoicedToCustomer,
            BigDecimal receivedPayments,
            BigDecimal accountsReceivable,
            BigDecimal plannedBudget,
            BigDecimal committed,
            BigDecimal actualCost,
            BigDecimal invoicedFromSuppliers,
            BigDecimal paidToSuppliers,
            BigDecimal accountsPayable,
            BigDecimal margin,
            BigDecimal profitabilityPercent,
            BigDecimal budgetUtilizationPercent,
            BigDecimal cashFlow,
            BigDecimal completionPercent
    ) {
        public static ComputedFinancials from(ProjectFinancialSummary s) {
            return new ComputedFinancials(
                    s.contractAmount(),
                    s.invoicedToCustomer(),
                    s.receivedPayments(),
                    s.accountsReceivable(),
                    s.plannedBudget(),
                    s.committed(),
                    s.actualCost(),
                    s.invoicedFromSuppliers(),
                    s.paidToSuppliers(),
                    s.accountsPayable(),
                    s.margin(),
                    s.profitabilityPercent(),
                    s.budgetUtilizationPercent(),
                    s.cashFlow(),
                    s.completionPercent()
            );
        }
    }
}
