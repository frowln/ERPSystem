package com.privod.platform.modules.bidScoring.domain;

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
import java.util.UUID;

@Entity
@Table(name = "bid_criteria", indexes = {
        @Index(name = "idx_bid_criteria_comparison", columnList = "bid_comparison_id"),
        @Index(name = "idx_bid_criteria_type", columnList = "criteria_type")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BidCriteria extends BaseEntity {

    @Column(name = "bid_comparison_id", nullable = false)
    private UUID bidComparisonId;

    @Enumerated(EnumType.STRING)
    @Column(name = "criteria_type", length = 30)
    private CriteriaType criteriaType;

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "weight", nullable = false, precision = 5, scale = 2)
    private BigDecimal weight;

    @Column(name = "max_score", nullable = false)
    @Builder.Default
    private Integer maxScore = 10;

    @Column(name = "sort_order")
    private Integer sortOrder;
}
