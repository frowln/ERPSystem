package com.privod.platform.modules.hrRussian.web.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public record CreateRotationScheduleRequest(
        @NotNull(message = "ID сотрудника обязателен")
        UUID employeeId,

        UUID projectId,

        @NotNull(message = "Дата начала вахты обязательна")
        LocalDate shiftStart,

        @NotNull(message = "Дата окончания вахты обязательна")
        LocalDate shiftEnd,

        @NotNull(message = "Количество рабочих дней обязательно")
        @Min(value = 1, message = "Количество рабочих дней должно быть не менее 1")
        Integer workDays,

        @NotNull(message = "Количество дней отдыха обязательно")
        @Min(value = 1, message = "Количество дней отдыха должно быть не менее 1")
        Integer restDays,

        /** Вахтовая надбавка в % (ст. 302 ТК РФ, не ниже 3%) */
        Double shiftBonusPercent,

        String notes
) {
}
