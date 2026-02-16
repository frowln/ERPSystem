package com.privod.platform.modules.analytics.web.dto;

import com.privod.platform.modules.analytics.domain.DashboardType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateDashboardRequest(
        @NotBlank(message = "Код панели обязателен")
        @Size(max = 100, message = "Код не должен превышать 100 символов")
        String code,

        @NotBlank(message = "Название панели обязательно")
        @Size(max = 500, message = "Название не должно превышать 500 символов")
        String name,

        @Size(max = 5000, message = "Описание не должно превышать 5000 символов")
        String description,

        UUID ownerId,

        DashboardType dashboardType,

        String layoutConfig,

        Boolean isDefault,

        Boolean isPublic
) {
}
