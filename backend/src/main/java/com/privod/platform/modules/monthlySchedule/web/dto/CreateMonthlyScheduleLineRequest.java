package com.privod.platform.modules.monthlySchedule.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateMonthlyScheduleLineRequest(
        @NotNull(message = "ID графика обязателен")
        UUID scheduleId,

        @NotBlank(message = "Наименование работ обязательно")
        @Size(max = 500, message = "Наименование работ не должно превышать 500 символов")
        String workName,

        String unit,

        BigDecimal plannedVolume,

        BigDecimal actualVolume,

        LocalDate startDate,

        LocalDate endDate,

        String responsible,

        String notes
) {
}
