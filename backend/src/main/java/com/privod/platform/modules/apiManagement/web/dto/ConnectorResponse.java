package com.privod.platform.modules.apiManagement.web.dto;

import com.privod.platform.modules.apiManagement.domain.ConnectorAuthType;
import com.privod.platform.modules.apiManagement.domain.ConnectorCategory;
import com.privod.platform.modules.apiManagement.domain.IntegrationConnector;

import java.time.Instant;
import java.util.UUID;

public record ConnectorResponse(
        UUID id,
        String name,
        String slug,
        String description,
        ConnectorCategory category,
        String categoryDisplayName,
        String iconUrl,
        String documentationUrl,
        String apiBaseUrl,
        ConnectorAuthType authType,
        String authTypeDisplayName,
        boolean isFirstParty,
        boolean isActive,
        String configSchemaJson,
        Instant createdAt,
        Instant updatedAt
) {
    public static ConnectorResponse fromEntity(IntegrationConnector entity) {
        return new ConnectorResponse(
                entity.getId(),
                entity.getName(),
                entity.getSlug(),
                entity.getDescription(),
                entity.getCategory(),
                entity.getCategory().getDisplayName(),
                entity.getIconUrl(),
                entity.getDocumentationUrl(),
                entity.getApiBaseUrl(),
                entity.getAuthType(),
                entity.getAuthType().getDisplayName(),
                entity.isFirstParty(),
                entity.isActive(),
                entity.getConfigSchemaJson(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
