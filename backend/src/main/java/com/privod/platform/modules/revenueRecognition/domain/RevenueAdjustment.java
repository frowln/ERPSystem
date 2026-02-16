package com.privod.platform.modules.revenueRecognition.domain;

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
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "revenue_adjustments", indexes = {
        @Index(name = "idx_rev_adj_period", columnList = "recognition_period_id"),
        @Index(name = "idx_rev_adj_type", columnList = "adjustment_type")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RevenueAdjustment extends BaseEntity {

    @Column(name = "recognition_period_id", nullable = false)
    private UUID recognitionPeriodId;

    @Column(name = "adjustment_type", nullable = false, length = 30)
    private String adjustmentType;

    @Column(name = "amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;

    @Column(name = "reason", nullable = false, columnDefinition = "TEXT")
    private String reason;

    @Column(name = "previous_value", precision = 18, scale = 2)
    private BigDecimal previousValue;

    @Column(name = "new_value", precision = 18, scale = 2)
    private BigDecimal newValue;

    @Column(name = "approved_by_id")
    private UUID approvedById;

    @Column(name = "approved_at")
    private Instant approvedAt;
}
