package com.privod.platform.modules.analytics.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateBiDashboardRequest(
        @NotBlank(message = "Название панели обязательно")
        @Size(max = 500, message = "Название не должно превышать 500 символов")
        String name,

        String description,
        String layout,
        Boolean isDefault,
        UUID ownerId,
        Boolean isShared,
        Integer refreshIntervalSeconds
) {
}
