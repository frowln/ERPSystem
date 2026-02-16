package com.privod.platform.modules.analytics.web.dto;

import com.privod.platform.modules.analytics.domain.WidgetType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateWidgetRequest(
        @NotNull(message = "Тип виджета обязателен")
        WidgetType widgetType,

        @NotBlank(message = "Заголовок виджета обязателен")
        @Size(max = 500, message = "Заголовок не должен превышать 500 символов")
        String title,

        @NotBlank(message = "Источник данных обязателен")
        @Size(max = 255, message = "Источник данных не должен превышать 255 символов")
        String dataSource,

        String configJson,

        @Min(value = 0, message = "Позиция X не может быть отрицательной")
        Integer positionX,

        @Min(value = 0, message = "Позиция Y не может быть отрицательной")
        Integer positionY,

        @Min(value = 1, message = "Ширина должна быть не менее 1")
        @Max(value = 12, message = "Ширина не должна превышать 12")
        Integer width,

        @Min(value = 1, message = "Высота должна быть не менее 1")
        @Max(value = 12, message = "Высота не должна превышать 12")
        Integer height,

        @Min(value = 10, message = "Интервал обновления должен быть не менее 10 секунд")
        Integer refreshIntervalSeconds
) {
}
