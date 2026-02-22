package com.privod.platform.modules.analytics.domain;

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
import org.hibernate.annotations.Filter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "project_risk_predictions", indexes = {
        @Index(name = "idx_risk_pred_org", columnList = "organization_id"),
        @Index(name = "idx_risk_pred_project", columnList = "project_id"),
        @Index(name = "idx_risk_pred_type", columnList = "prediction_type"),
        @Index(name = "idx_risk_pred_alert", columnList = "alert_generated"),
        @Index(name = "idx_risk_pred_prob", columnList = "probability_percent")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectRiskPrediction extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "model_id")
    private UUID modelId;

    @Enumerated(EnumType.STRING)
    @Column(name = "prediction_type", nullable = false, length = 20)
    private PredictionModelType predictionType;

    @Column(name = "probability_percent", nullable = false, precision = 5, scale = 2)
    private BigDecimal probabilityPercent;

    @Enumerated(EnumType.STRING)
    @Column(name = "confidence_level", nullable = false, length = 10)
    private ConfidenceLevel confidenceLevel;

    @Column(name = "risk_factors_json", columnDefinition = "JSONB", nullable = false)
    @Builder.Default
    private String riskFactorsJson = "[]";

    @Column(name = "predicted_delay_days")
    private Integer predictedDelayDays;

    @Column(name = "predicted_overrun_amount", precision = 18, scale = 2)
    private BigDecimal predictedOverrunAmount;

    @Column(name = "alert_generated", nullable = false)
    @Builder.Default
    private boolean alertGenerated = false;

    @Column(name = "predicted_at", nullable = false)
    @Builder.Default
    private Instant predictedAt = Instant.now();

    @Column(name = "valid_until")
    private Instant validUntil;
}
