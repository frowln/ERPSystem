package com.privod.platform.modules.mobile.web.dto;

import com.privod.platform.modules.mobile.domain.MobileDevice;
import com.privod.platform.modules.mobile.domain.MobilePlatform;

import java.time.Instant;
import java.util.UUID;

public record MobileDeviceResponse(
        UUID id,
        UUID userId,
        String deviceToken,
        MobilePlatform platform,
        String platformDisplayName,
        String deviceModel,
        String osVersion,
        String appVersion,
        Instant lastActiveAt,
        Boolean isActive,
        Instant createdAt
) {
    public static MobileDeviceResponse fromEntity(MobileDevice entity) {
        return new MobileDeviceResponse(
                entity.getId(),
                entity.getUserId(),
                entity.getDeviceToken(),
                entity.getPlatform(),
                entity.getPlatform().getDisplayName(),
                entity.getDeviceModel(),
                entity.getOsVersion(),
                entity.getAppVersion(),
                entity.getLastActiveAt(),
                entity.getIsActive(),
                entity.getCreatedAt()
        );
    }
}
