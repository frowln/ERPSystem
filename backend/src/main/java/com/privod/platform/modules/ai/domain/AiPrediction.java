package com.privod.platform.modules.ai.domain;

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
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "ai_predictions", indexes = {
        @Index(name = "idx_ai_prediction_project", columnList = "project_id"),
        @Index(name = "idx_ai_prediction_type", columnList = "prediction_type")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiPrediction extends BaseEntity {

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Enumerated(EnumType.STRING)
    @Column(name = "prediction_type", nullable = false, length = 30)
    private PredictionType predictionType;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "input_data", nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> inputData;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "result", nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> result;

    @Column(name = "confidence")
    private Double confidence;

    @Column(name = "actual_value")
    private Double actualValue;

    @Column(name = "accuracy")
    private Double accuracy;
}
