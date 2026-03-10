package com.privod.platform.modules.mobile.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record CreateFieldReportRequest(
        @NotBlank(message = "Заголовок обязателен")
        @Size(max = 500, message = "Заголовок не должен превышать 500 символов")
        String title,

        @Size(max = 10000, message = "Описание не должно превышать 10000 символов")
        String description,

        @NotNull(message = "ID проекта обязателен")
        UUID projectId,

        @Size(max = 500, message = "Локация не должна превышать 500 символов")
        String location,

        @Size(max = 50, message = "Погодные условия не должны превышать 50 символов")
        String weatherCondition,

        Double temperature,

        Integer workersOnSite,

        @NotNull(message = "Дата отчёта обязательна")
        LocalDate reportDate
) {
}
