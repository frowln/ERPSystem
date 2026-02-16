package com.privod.platform.modules.hrRussian.web.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateStaffingTableRequest(
        @NotBlank(message = "Наименование должности обязательно")
        @Size(max = 300)
        String positionName,

        UUID departmentId,

        @Size(max = 50)
        String grade,

        @NotNull(message = "Минимальный оклад обязателен")
        BigDecimal salaryMin,

        @NotNull(message = "Максимальный оклад обязателен")
        BigDecimal salaryMax,

        @Min(value = 0, message = "Штатная численность не может быть отрицательной")
        int headcount,

        @NotNull(message = "Дата вступления в силу обязательна")
        LocalDate effectiveDate
) {
}
