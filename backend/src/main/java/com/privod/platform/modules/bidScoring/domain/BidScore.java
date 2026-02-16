package com.privod.platform.modules.bidScoring.domain;

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
@Table(name = "bid_scores", indexes = {
        @Index(name = "idx_bid_score_comparison", columnList = "bid_comparison_id"),
        @Index(name = "idx_bid_score_criteria", columnList = "criteria_id"),
        @Index(name = "idx_bid_score_vendor", columnList = "vendor_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BidScore extends BaseEntity {

    @Column(name = "bid_comparison_id", nullable = false)
    private UUID bidComparisonId;

    @Column(name = "criteria_id", nullable = false)
    private UUID criteriaId;

    @Column(name = "vendor_id", nullable = false)
    private UUID vendorId;

    @Column(name = "vendor_name", length = 500)
    private String vendorName;

    @Column(name = "score", nullable = false, precision = 5, scale = 2)
    private BigDecimal score;

    @Column(name = "weighted_score", precision = 10, scale = 4)
    private BigDecimal weightedScore;

    @Column(name = "comments", columnDefinition = "TEXT")
    private String comments;

    @Column(name = "scored_by_id")
    private UUID scoredById;

    @Column(name = "scored_at")
    private Instant scoredAt;
}
