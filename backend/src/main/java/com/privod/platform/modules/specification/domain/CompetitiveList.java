package com.privod.platform.modules.specification.domain;

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
@Table(name = "competitive_lists", indexes = {
        @Index(name = "idx_cl_project", columnList = "project_id"),
        @Index(name = "idx_cl_spec", columnList = "specification_id"),
        @Index(name = "idx_cl_status", columnList = "status")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompetitiveList extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "specification_id", nullable = false)
    private UUID specificationId;

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private CompetitiveListStatus status = CompetitiveListStatus.DRAFT;

    @Column(name = "min_proposals_required", nullable = false)
    @Builder.Default
    private int minProposalsRequired = 3;

    @Column(name = "created_by_id")
    private UUID createdById;

    @Column(name = "decided_by_id")
    private UUID decidedById;

    @Column(name = "decided_at")
    private Instant decidedAt;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "budget_item_id")
    private UUID budgetItemId;

    @Column(name = "best_price", precision = 18, scale = 2)
    private BigDecimal bestPrice;

    @Column(name = "best_vendor_name", length = 500)
    private String bestVendorName;
}
