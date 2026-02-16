package com.privod.platform.modules.mobile.web.dto;

import com.privod.platform.modules.mobile.domain.MobilePlatform;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record RegisterDeviceRequest(
        @NotNull(message = "User ID is required")
        UUID userId,

        @NotBlank(message = "Device token is required")
        @Size(max = 500, message = "Device token must not exceed 500 characters")
        String deviceToken,

        @NotNull(message = "Platform is required")
        MobilePlatform platform,

        @Size(max = 200, message = "Device model must not exceed 200 characters")
        String deviceModel,

        @Size(max = 100, message = "OS version must not exceed 100 characters")
        String osVersion,

        @Size(max = 100, message = "App version must not exceed 100 characters")
        String appVersion
) {
}
