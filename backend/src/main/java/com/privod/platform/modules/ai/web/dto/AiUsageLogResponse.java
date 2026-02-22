package com.privod.platform.modules.ai.web.dto;

import com.privod.platform.modules.ai.domain.AiUsageLog;

import java.time.Instant;
import java.util.UUID;

public record AiUsageLogResponse(
        UUID id,
        UUID userId,
        UUID conversationId,
        UUID modelConfigId,
        String feature,
        Integer tokensInput,
        Integer tokensOutput,
        Double cost,
        Double costRub,
        Long responseTimeMs,
        Boolean wasSuccessful,
        String errorMessage,
        Instant createdAt
) {
    public static AiUsageLogResponse fromEntity(AiUsageLog entity) {
        return new AiUsageLogResponse(
                entity.getId(),
                entity.getUserId(),
                entity.getConversationId(),
                entity.getModelConfigId(),
                entity.getFeature(),
                entity.getTokensInput(),
                entity.getTokensOutput(),
                entity.getCost(),
                entity.getCostRub(),
                entity.getResponseTimeMs(),
                entity.getWasSuccessful(),
                entity.getErrorMessage(),
                entity.getCreatedAt()
        );
    }
}
