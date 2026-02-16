package com.privod.platform.modules.regulatory.web.dto;

import com.privod.platform.modules.regulatory.domain.ReportingFrequency;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateReportingDeadlineRequest(
        @NotBlank(message = "Название дедлайна обязательно")
        @Size(max = 500, message = "Название не должно превышать 500 символов")
        String name,

        @NotBlank(message = "Тип отчёта обязателен")
        @Size(max = 50, message = "Тип отчёта не должен превышать 50 символов")
        String reportType,

        ReportingFrequency frequency,

        @NotNull(message = "Дата сдачи обязательна")
        LocalDate dueDate,

        Integer reminderDaysBefore,
        UUID responsibleId,
        String notes,

        @Size(max = 100, message = "Регулирующий орган не должен превышать 100 символов")
        String regulatoryBody,

        BigDecimal penaltyAmount
) {
}
