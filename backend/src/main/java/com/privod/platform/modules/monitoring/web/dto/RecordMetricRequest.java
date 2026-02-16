package com.privod.platform.modules.monitoring.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.Map;

public record RecordMetricRequest(
        @NotBlank(message = "Имя метрики обязательно")
        @Size(max = 200, message = "Имя метрики не должно превышать 200 символов")
        String metricName,

        @NotNull(message = "Значение метрики обязательно")
        Double metricValue,

        @Size(max = 50)
        String metricUnit,

        Map<String, String> tags
) {
}
