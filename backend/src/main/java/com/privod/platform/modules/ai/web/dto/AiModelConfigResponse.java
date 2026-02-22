package com.privod.platform.modules.ai.web.dto;

import com.privod.platform.modules.ai.domain.AiModelConfig;
import com.privod.platform.modules.ai.domain.AiProvider;

import java.time.Instant;
import java.util.UUID;

public record AiModelConfigResponse(
        UUID id,
        UUID organizationId,
        AiProvider provider,
        String providerDisplayName,
        String apiUrl,
        String modelName,
        Integer maxTokens,
        Double temperature,
        Boolean isActive,
        Boolean isDefault,
        Boolean dataProcessingAgreementSigned,
        Instant createdAt,
        Instant updatedAt
) {
    public static AiModelConfigResponse fromEntity(AiModelConfig entity) {
        return new AiModelConfigResponse(
                entity.getId(),
                entity.getOrganizationId(),
                entity.getProvider(),
                entity.getProvider().getDisplayName(),
                entity.getApiUrl(),
                entity.getModelName(),
                entity.getMaxTokens(),
                entity.getTemperature(),
                entity.getIsActive(),
                entity.getIsDefault(),
                entity.getDataProcessingAgreementSigned(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
