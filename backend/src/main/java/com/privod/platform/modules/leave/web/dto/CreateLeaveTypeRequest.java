package com.privod.platform.modules.leave.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateLeaveTypeRequest(

        @NotBlank(message = "Название типа отпуска обязательно")
        @Size(max = 255, message = "Название не должно превышать 255 символов")
        String name,

        @NotBlank(message = "Код типа отпуска обязателен")
        @Size(max = 50, message = "Код не должен превышать 50 символов")
        String code,

        @Size(max = 20)
        String color,

        BigDecimal maxDays,
        Boolean requiresApproval,
        Boolean allowNegative,
        LocalDate validityStart,
        LocalDate validityEnd
) {
}
