package com.privod.platform.modules.safety.web.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public record CreatePpeIssueRequest(
        @NotNull(message = "ID сотрудника обязателен")
        UUID employeeId,

        String employeeName,

        @NotNull(message = "ID позиции СИЗ обязателен")
        UUID itemId,

        @NotNull(message = "Количество обязательно")
        @Min(value = 1, message = "Количество должно быть не менее 1")
        Integer quantity,

        @NotNull(message = "Дата выдачи обязательна")
        LocalDate issuedDate,

        String notes
) {
}
