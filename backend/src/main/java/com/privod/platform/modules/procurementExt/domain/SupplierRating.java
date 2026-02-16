package com.privod.platform.modules.procurementExt.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "supplier_ratings", indexes = {
        @Index(name = "idx_sr_supplier", columnList = "supplier_id"),
        @Index(name = "idx_sr_period", columnList = "period_id"),
        @Index(name = "idx_sr_overall", columnList = "overall_score")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupplierRating extends BaseEntity {

    @Column(name = "supplier_id", nullable = false)
    private UUID supplierId;

    @Column(name = "period_id", nullable = false, length = 20)
    private String periodId;

    @Column(name = "quality_score", nullable = false, precision = 4, scale = 2)
    @Builder.Default
    private BigDecimal qualityScore = BigDecimal.ZERO;

    @Column(name = "delivery_score", nullable = false, precision = 4, scale = 2)
    @Builder.Default
    private BigDecimal deliveryScore = BigDecimal.ZERO;

    @Column(name = "price_score", nullable = false, precision = 4, scale = 2)
    @Builder.Default
    private BigDecimal priceScore = BigDecimal.ZERO;

    @Column(name = "overall_score", nullable = false, precision = 4, scale = 2)
    @Builder.Default
    private BigDecimal overallScore = BigDecimal.ZERO;

    @Column(name = "evaluated_by_id")
    private UUID evaluatedById;

    @Column(name = "comments", columnDefinition = "TEXT")
    private String comments;

    public void recalculateOverall() {
        if (this.qualityScore != null && this.deliveryScore != null && this.priceScore != null) {
            this.overallScore = this.qualityScore
                    .add(this.deliveryScore)
                    .add(this.priceScore)
                    .divide(BigDecimal.valueOf(3), 2, java.math.RoundingMode.HALF_UP);
        }
    }
}
