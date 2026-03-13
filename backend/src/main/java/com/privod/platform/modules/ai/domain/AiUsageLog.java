package com.privod.platform.modules.ai.domain;

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
import org.hibernate.annotations.Filter;

import java.util.UUID;

@Entity
@Table(name = "ai_usage_logs", indexes = {
        @Index(name = "idx_ai_usage_user", columnList = "user_id"),
        @Index(name = "idx_ai_usage_feature", columnList = "feature"),
        @Index(name = "idx_ai_usage_created", columnList = "created_at")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiUsageLog extends BaseEntity {

    @Column(name = "organization_id")
    private UUID organizationId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "conversation_id")
    private UUID conversationId;

    @Column(name = "model_config_id")
    private UUID modelConfigId;

    @Column(name = "feature", nullable = false, length = 100)
    private String feature;

    @Column(name = "tokens_input", nullable = false)
    @Builder.Default
    private Integer tokensInput = 0;

    @Column(name = "tokens_output", nullable = false)
    @Builder.Default
    private Integer tokensOutput = 0;

    @Column(name = "cost")
    @Builder.Default
    private Double cost = 0.0;

    @Column(name = "cost_rub")
    @Builder.Default
    private Double costRub = 0.0;

    @Column(name = "response_time_ms")
    private Long responseTimeMs;

    @Column(name = "was_successful")
    @Builder.Default
    private Boolean wasSuccessful = true;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;
}
