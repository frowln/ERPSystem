package com.privod.platform.modules.hrRussian.web.dto;

import com.privod.platform.modules.hrRussian.domain.VacationType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public record CreateVacationRequest(
        @NotNull(message = "ID сотрудника обязателен")
        UUID employeeId,

        @NotNull(message = "Тип отпуска обязателен")
        VacationType vacationType,

        @NotNull(message = "Дата начала обязательна")
        LocalDate startDate,

        @NotNull(message = "Дата окончания обязательна")
        LocalDate endDate,

        @Min(value = 1, message = "Количество дней должно быть больше 0")
        int daysCount,

        UUID orderId,

        UUID substitutingEmployeeId
) {
}
