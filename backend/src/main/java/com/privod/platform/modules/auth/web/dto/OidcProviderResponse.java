package com.privod.platform.modules.auth.web.dto;

import com.privod.platform.modules.auth.domain.OidcProvider;

import java.time.Instant;
import java.util.UUID;

public record OidcProviderResponse(
        UUID id,
        String code,
        String name,
        String authorizationUrl,
        String tokenUrl,
        String userInfoUrl,
        String scope,
        boolean isActive,
        String iconUrl,
        Instant createdAt
) {
    public static OidcProviderResponse fromEntity(OidcProvider entity) {
        return new OidcProviderResponse(
                entity.getId(),
                entity.getCode(),
                entity.getName(),
                entity.getAuthorizationUrl(),
                entity.getTokenUrl(),
                entity.getUserInfoUrl(),
                entity.getScope(),
                entity.isActive(),
                entity.getIconUrl(),
                entity.getCreatedAt()
        );
    }
}
