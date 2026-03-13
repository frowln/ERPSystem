package com.privod.platform.modules.edo.web.dto;

import com.privod.platform.modules.edo.domain.EdoConfig;
import com.privod.platform.modules.edo.domain.EdoProvider;

import java.time.Instant;
import java.util.UUID;

public record EdoConfigResponse(
        UUID id,
        UUID organizationId,
        EdoProvider provider,
        String providerDisplayName,
        String apiKey,
        String boxId,
        String inn,
        String kpp,
        Boolean enabled,
        Instant createdAt,
        Instant updatedAt
) {
    public static EdoConfigResponse fromEntity(EdoConfig config) {
        return new EdoConfigResponse(
                config.getId(),
                config.getOrganizationId(),
                config.getProvider(),
                config.getProvider().getDisplayName(),
                maskApiKey(config.getApiKey()),
                config.getBoxId(),
                config.getInn(),
                config.getKpp(),
                config.getEnabled(),
                config.getCreatedAt(),
                config.getUpdatedAt()
        );
    }

    private static String maskApiKey(String apiKey) {
        if (apiKey == null || apiKey.length() <= 8) {
            return "****";
        }
        return apiKey.substring(0, 4) + "****" + apiKey.substring(apiKey.length() - 4);
    }
}
