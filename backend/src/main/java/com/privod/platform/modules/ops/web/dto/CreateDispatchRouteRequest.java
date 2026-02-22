package com.privod.platform.modules.ops.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record CreateDispatchRouteRequest(
        @NotBlank(message = "Название маршрута обязательно")
        @Size(max = 300, message = "Название маршрута не должно превышать 300 символов")
        String name,

        @NotBlank(message = "Пункт отправления обязателен")
        @Size(max = 500, message = "Пункт отправления не должен превышать 500 символов")
        String fromLocation,

        @NotBlank(message = "Пункт назначения обязателен")
        @Size(max = 500, message = "Пункт назначения не должен превышать 500 символов")
        String toLocation,

        @PositiveOrZero(message = "Расстояние не может быть отрицательным")
        BigDecimal distanceKm,

        @PositiveOrZero(message = "Время в пути не может быть отрицательным")
        Integer estimatedDurationMinutes
) {
}
