package com.privod.platform.modules.accounting.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateReclamationRequest(
        UUID contractId,
        UUID counterpartyId,
        UUID projectId,

        @Size(max = 50, message = "Номер рекламации не должен превышать 50 символов")
        String claimNumber,

        LocalDate claimDate,
        LocalDate deadline,

        @NotBlank(message = "Предмет рекламации обязателен")
        @Size(max = 500, message = "Предмет рекламации не должен превышать 500 символов")
        String subject,

        String description,
        BigDecimal amount
) {
}
