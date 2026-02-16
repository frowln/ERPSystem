package com.privod.platform.modules.scheduler.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.Map;

public record CreateScheduledJobRequest(
        @NotBlank(message = "Код задания обязателен")
        @Size(max = 100, message = "Код задания не должен превышать 100 символов")
        String code,

        @NotBlank(message = "Название задания обязательно")
        @Size(max = 255, message = "Название задания не должно превышать 255 символов")
        String name,

        String description,

        @NotBlank(message = "Cron выражение обязательно")
        @Size(max = 100, message = "Cron выражение не должно превышать 100 символов")
        String cronExpression,

        @NotBlank(message = "Класс задания обязателен")
        String jobClass,

        @NotBlank(message = "Метод задания обязателен")
        String jobMethod,

        Map<String, Object> parameters,
        Integer maxRetries
) {
}
