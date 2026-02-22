package com.privod.platform.modules.commercialProposal.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Filter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "commercial_proposals", indexes = {
        @Index(name = "idx_cp_project", columnList = "project_id"),
        @Index(name = "idx_cp_budget", columnList = "budget_id"),
        @Index(name = "idx_cp_status", columnList = "status")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommercialProposal extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "budget_id", nullable = false)
    private UUID budgetId;

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private ProposalStatus status = ProposalStatus.DRAFT;

    @Column(name = "total_cost_price", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal totalCostPrice = BigDecimal.ZERO;

    @Column(name = "created_by_id")
    private UUID createdById;

    @Column(name = "approved_by_id")
    private UUID approvedById;

    @Column(name = "approved_at")
    private Instant approvedAt;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "specification_id")
    private UUID specificationId;

    @Column(name = "total_customer_price", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal totalCustomerPrice = BigDecimal.ZERO;

    @Column(name = "total_margin", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal totalMargin = BigDecimal.ZERO;

    @Column(name = "margin_percent", precision = 8, scale = 4)
    @Builder.Default
    private BigDecimal marginPercent = BigDecimal.ZERO;
}
