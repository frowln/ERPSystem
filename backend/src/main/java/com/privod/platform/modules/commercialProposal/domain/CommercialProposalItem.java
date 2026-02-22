package com.privod.platform.modules.commercialProposal.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "commercial_proposal_items", indexes = {
        @Index(name = "idx_cpi_proposal", columnList = "proposal_id"),
        @Index(name = "idx_cpi_budget_item", columnList = "budget_item_id"),
        @Index(name = "idx_cpi_status", columnList = "status")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommercialProposalItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "proposal_id", nullable = false)
    private UUID proposalId;

    @Column(name = "budget_item_id", nullable = false)
    private UUID budgetItemId;

    @Column(name = "item_type", nullable = false, length = 20)
    private String itemType;

    @Column(name = "selected_invoice_line_id")
    private UUID selectedInvoiceLineId;

    @Column(name = "estimate_item_id")
    private UUID estimateItemId;

    @Column(name = "trading_coefficient", precision = 8, scale = 4)
    @Builder.Default
    private BigDecimal tradingCoefficient = BigDecimal.ONE;

    @Column(name = "cost_price", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal costPrice = BigDecimal.ZERO;

    @Column(name = "quantity", precision = 18, scale = 4)
    @Builder.Default
    private BigDecimal quantity = BigDecimal.ONE;

    @Column(name = "total_cost", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal totalCost = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private ProposalItemStatus status = ProposalItemStatus.UNPROCESSED;

    @Column(name = "approved_by_id")
    private UUID approvedById;

    @Column(name = "approved_at")
    private Instant approvedAt;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "competitive_list_entry_id")
    private UUID competitiveListEntryId;

    @Column(name = "competitive_list_id")
    private UUID competitiveListId;

    @Column(name = "spec_item_id")
    private UUID specItemId;

    @Column(name = "unit_price", precision = 18, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "unit", length = 50)
    private String unit;

    @Column(name = "vendor_name", length = 500)
    private String vendorName;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
