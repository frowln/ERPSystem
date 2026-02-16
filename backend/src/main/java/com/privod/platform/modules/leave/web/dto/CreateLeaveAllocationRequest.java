package com.privod.platform.modules.leave.web.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record CreateLeaveAllocationRequest(

        @NotNull(message = "ID сотрудника обязателен")
        UUID employeeId,

        @NotNull(message = "ID типа отпуска обязателен")
        UUID leaveTypeId,

        @NotNull(message = "Количество выделенных дней обязательно")
        BigDecimal allocatedDays,

        @Min(value = 2000, message = "Год должен быть не менее 2000")
        int year,

        String notes
) {
}
