package com.privod.platform.modules.integration.web.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public record BankStatementRequest(
        @NotNull(message = "Идентификатор точки интеграции обязателен")
        UUID endpointId,

        @NotNull(message = "Дата начала обязательна")
        LocalDate dateFrom,

        @NotNull(message = "Дата окончания обязательна")
        LocalDate dateTo,

        String accountNumber
) {
}
