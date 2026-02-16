package com.privod.platform.modules.safety.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public record CreateSafetyCertificateRequest(
        @NotNull(message = "ID сотрудника обязателен")
        UUID employeeId,

        @NotBlank(message = "Тип удостоверения обязателен")
        String type,

        String number,

        @NotNull(message = "Дата выдачи обязательна")
        LocalDate issueDate,

        LocalDate expiryDate,

        String issuingAuthority,

        String notes
) {
}
