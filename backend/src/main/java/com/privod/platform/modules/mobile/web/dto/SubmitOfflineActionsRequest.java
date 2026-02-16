package com.privod.platform.modules.mobile.web.dto;

import com.privod.platform.modules.mobile.domain.OfflineActionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.Map;
import java.util.UUID;

public record SubmitOfflineActionsRequest(
        @NotNull(message = "User ID is required")
        UUID userId,

        UUID deviceId,

        @NotNull(message = "Action type is required")
        OfflineActionType actionType,

        @NotBlank(message = "Entity type is required")
        String entityType,

        UUID entityId,

        @NotNull(message = "Payload is required")
        Map<String, Object> payload
) {
}
