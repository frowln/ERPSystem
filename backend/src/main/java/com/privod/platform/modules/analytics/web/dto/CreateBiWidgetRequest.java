package com.privod.platform.modules.analytics.web.dto;

import com.privod.platform.modules.analytics.domain.BiWidgetType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateBiWidgetRequest(
        @NotNull(message = "Идентификатор панели обязателен")
        UUID dashboardId,

        @NotNull(message = "Тип виджета обязателен")
        BiWidgetType widgetType,

        @NotBlank(message = "Заголовок виджета обязателен")
        @Size(max = 500, message = "Заголовок не должен превышать 500 символов")
        String title,

        @NotBlank(message = "Источник данных обязателен")
        String dataSource,

        String query,
        String config,
        String position,
        String size,
        Integer refreshIntervalSeconds
) {
}
