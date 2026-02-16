package com.privod.platform.modules.hr.web.dto;

import jakarta.validation.constraints.DecimalMin;

import java.math.BigDecimal;

public record UpdateTimesheetRequest(
        @DecimalMin(value = "0.01", message = "Количество часов должно быть больше 0")
        BigDecimal hoursWorked,

        @DecimalMin(value = "0", message = "Сверхурочные часы не могут быть отрицательными")
        BigDecimal overtimeHours,

        String notes
) {
}
