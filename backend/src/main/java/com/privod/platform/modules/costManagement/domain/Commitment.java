package com.privod.platform.modules.costManagement.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "commitments", indexes = {
        @Index(name = "idx_commitment_project", columnList = "project_id"),
        @Index(name = "idx_commitment_status", columnList = "status"),
        @Index(name = "idx_commitment_type", columnList = "commitment_type"),
        @Index(name = "idx_commitment_vendor", columnList = "vendor_id"),
        @Index(name = "idx_commitment_contract", columnList = "contract_id"),
        @Index(name = "idx_commitment_cost_code", columnList = "cost_code_id"),
        @Index(name = "idx_commitment_number", columnList = "number")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uq_commitment_project_number", columnNames = {"project_id", "number"})
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Commitment extends BaseEntity {

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "number", length = 50)
    private String number;

    @Column(name = "title", nullable = false, length = 500)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(name = "commitment_type", nullable = false, length = 30)
    private CommitmentType commitmentType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private CommitmentStatus status = CommitmentStatus.DRAFT;

    @Column(name = "vendor_id")
    private UUID vendorId;

    @Column(name = "contract_id")
    private UUID contractId;

    @Column(name = "original_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal originalAmount;

    @Column(name = "revised_amount", precision = 18, scale = 2)
    private BigDecimal revisedAmount;

    @Column(name = "approved_change_orders", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal approvedChangeOrders = BigDecimal.ZERO;

    @Column(name = "invoiced_amount", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal invoicedAmount = BigDecimal.ZERO;

    @Column(name = "paid_amount", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal paidAmount = BigDecimal.ZERO;

    @Column(name = "retention_percent", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal retentionPercent = BigDecimal.ZERO;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "cost_code_id")
    private UUID costCodeId;

    public boolean canTransitionTo(CommitmentStatus newStatus) {
        return this.status.canTransitionTo(newStatus);
    }

    /**
     * revisedAmount = originalAmount + approvedChangeOrders
     */
    public void recalculateRevisedAmount() {
        BigDecimal original = this.originalAmount != null ? this.originalAmount : BigDecimal.ZERO;
        BigDecimal changes = this.approvedChangeOrders != null ? this.approvedChangeOrders : BigDecimal.ZERO;
        this.revisedAmount = original.add(changes);
    }

    public BigDecimal getRemainingAmount() {
        BigDecimal revised = this.revisedAmount != null ? this.revisedAmount : BigDecimal.ZERO;
        BigDecimal invoiced = this.invoicedAmount != null ? this.invoicedAmount : BigDecimal.ZERO;
        return revised.subtract(invoiced);
    }
}
