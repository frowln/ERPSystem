package com.privod.platform.modules.specification.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "competitive_list_entries", indexes = {
        @Index(name = "idx_cle_list", columnList = "competitive_list_id"),
        @Index(name = "idx_cle_spec_item", columnList = "spec_item_id"),
        @Index(name = "idx_cle_vendor", columnList = "vendor_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompetitiveListEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "competitive_list_id", nullable = false)
    private UUID competitiveListId;

    @Column(name = "spec_item_id", nullable = false)
    private UUID specItemId;

    @Column(name = "invoice_id")
    private UUID invoiceId;

    @Column(name = "invoice_line_id")
    private UUID invoiceLineId;

    @Column(name = "vendor_id")
    private UUID vendorId;

    @Column(name = "vendor_name", length = 500)
    private String vendorName;

    @Column(name = "unit_price", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal unitPrice = BigDecimal.ZERO;

    @Column(name = "quantity", nullable = false, precision = 18, scale = 4)
    @Builder.Default
    private BigDecimal quantity = BigDecimal.ZERO;

    @Column(name = "total_price", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal totalPrice = BigDecimal.ZERO;

    @Column(name = "delivery_days")
    private Integer deliveryDays;

    @Column(name = "payment_terms", length = 500)
    private String paymentTerms;

    @Column(name = "is_winner", nullable = false)
    @Builder.Default
    private boolean isWinner = false;

    @Column(name = "selection_reason", columnDefinition = "TEXT")
    private String selectionReason;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "prepayment_percent", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal prepaymentPercent = BigDecimal.ZERO;

    @Column(name = "payment_delay_days")
    private Integer paymentDelayDays;

    @Column(name = "warranty_months")
    private Integer warrantyMonths;

    @Column(name = "score", precision = 5, scale = 2)
    private BigDecimal score;

    @Column(name = "rank_position")
    private Integer rankPosition;

    @Column(name = "rejection_type", length = 20)
    private String rejectionType;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

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
