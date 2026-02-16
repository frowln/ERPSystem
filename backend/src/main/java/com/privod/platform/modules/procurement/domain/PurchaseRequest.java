package com.privod.platform.modules.procurement.domain;

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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "purchase_requests", indexes = {
        @Index(name = "idx_pr_org", columnList = "organization_id"),
        @Index(name = "idx_pr_org_project", columnList = "organization_id, project_id"),
        @Index(name = "idx_pr_org_status", columnList = "organization_id, status"),
        @Index(name = "idx_pr_request_date", columnList = "request_date"),
        @Index(name = "idx_pr_project", columnList = "project_id"),
        @Index(name = "idx_pr_status", columnList = "status"),
        @Index(name = "idx_pr_priority", columnList = "priority"),
        @Index(name = "idx_pr_assigned_to", columnList = "assigned_to_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseRequest extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "name", nullable = false, unique = true, length = 50)
    private String name;

    @Column(name = "request_date", nullable = false)
    private LocalDate requestDate;

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "contract_id")
    private UUID contractId;

    @Column(name = "specification_id")
    private UUID specificationId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private PurchaseRequestStatus status = PurchaseRequestStatus.DRAFT;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false, length = 10)
    @Builder.Default
    private PurchaseRequestPriority priority = PurchaseRequestPriority.MEDIUM;

    @Column(name = "requested_by_id")
    private UUID requestedById;

    @Column(name = "requested_by_name", length = 255)
    private String requestedByName;

    @Column(name = "approved_by_id")
    private UUID approvedById;

    @Column(name = "assigned_to_id")
    private UUID assignedToId;

    @Column(name = "total_amount", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    public boolean canTransitionTo(PurchaseRequestStatus newStatus) {
        return this.status.canTransitionTo(newStatus);
    }
}
