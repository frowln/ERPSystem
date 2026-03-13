package com.privod.platform.modules.selfEmployed.web.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.UUID;

public record CreateActRequest(
        @NotNull(message = "ID исполнителя обязателен")
        UUID workerId,

        UUID projectId,

        @NotBlank(message = "Номер акта обязателен")
        @Size(max = 50, message = "Номер акта не должен превышать 50 символов")
        String actNumber,

        String description,

        @NotNull(message = "Сумма обязательна")
        @DecimalMin(value = "0.01", message = "Сумма должна быть больше нуля")
        BigDecimal amount,

        @Size(max = 7, message = "Период в формате YYYY-MM")
        String period
) {
}
