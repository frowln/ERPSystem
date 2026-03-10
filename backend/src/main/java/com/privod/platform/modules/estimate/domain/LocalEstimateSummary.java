package com.privod.platform.modules.estimate.domain;

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

/**
 * LSR Summary block (konzovka).
 * Contains the totals, surcharges, and grand total for a local estimate.
 */
@Entity
@Table(name = "local_estimate_summaries", indexes = {
        @Index(name = "idx_les_estimate", columnList = "estimate_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LocalEstimateSummary {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "estimate_id", nullable = false)
    private UUID estimateId;

    @Column(name = "direct_costs_total", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal directCostsTotal = BigDecimal.ZERO;

    @Column(name = "overhead_total", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal overheadTotal = BigDecimal.ZERO;

    @Column(name = "profit_total", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal profitTotal = BigDecimal.ZERO;

    @Column(name = "subtotal", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal subtotal = BigDecimal.ZERO;

    @Column(name = "winter_surcharge", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal winterSurcharge = BigDecimal.ZERO;

    @Column(name = "winter_surcharge_rate", precision = 8, scale = 4)
    @Builder.Default
    private BigDecimal winterSurchargeRate = BigDecimal.ZERO;

    @Column(name = "temp_structures", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal tempStructures = BigDecimal.ZERO;

    @Column(name = "temp_structures_rate", precision = 8, scale = 4)
    @Builder.Default
    private BigDecimal tempStructuresRate = BigDecimal.ZERO;

    @Column(name = "contingency", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal contingency = BigDecimal.ZERO;

    @Column(name = "contingency_rate", precision = 8, scale = 4)
    @Builder.Default
    private BigDecimal contingencyRate = BigDecimal.ZERO;

    @Column(name = "vat_rate", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal vatRate = new BigDecimal("20.00");

    @Column(name = "vat_amount", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal vatAmount = BigDecimal.ZERO;

    @Column(name = "grand_total", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal grandTotal = BigDecimal.ZERO;

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
