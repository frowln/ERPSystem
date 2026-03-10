package com.privod.platform.modules.bidManagement.domain;

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
@Table(name = "bid_evaluations", indexes = {
        @Index(name = "idx_bid_eval_pkg", columnList = "bid_package_id"),
        @Index(name = "idx_bid_eval_inv", columnList = "invitation_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BidEvaluation extends BaseEntity {

    @Column(name = "bid_package_id", nullable = false)
    private UUID bidPackageId;

    @Column(name = "invitation_id", nullable = false)
    private UUID invitationId;

    @Column(name = "criteria_name", nullable = false, length = 255)
    private String criteriaName;

    @Column(name = "score")
    private Integer score;

    @Column(name = "max_score")
    @Builder.Default
    private Integer maxScore = 10;

    @Column(name = "weight", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal weight = BigDecimal.ONE;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "evaluator_name", length = 255)
    private String evaluatorName;
}
