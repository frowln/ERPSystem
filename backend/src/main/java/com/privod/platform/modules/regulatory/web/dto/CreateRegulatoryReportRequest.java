package com.privod.platform.modules.regulatory.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public record CreateRegulatoryReportRequest(
        UUID projectId,

        @NotBlank(message = "Тип отчёта обязателен")
        String reportType,

        @NotBlank(message = "Заголовок отчёта обязателен")
        String title,

        String period,
        LocalDate dueDate,
        String submittedToOrgan,
        String fileUrl,
        UUID preparedById
) {
}
