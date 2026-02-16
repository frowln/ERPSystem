package com.privod.platform.modules.legal.web.dto;

import com.privod.platform.modules.legal.domain.CaseType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateLegalCaseRequest(
        @Size(max = 100)
        String caseNumber,

        UUID projectId,

        UUID contractId,

        @NotBlank(message = "Название дела обязательно")
        @Size(max = 500)
        String title,

        String description,

        @NotNull(message = "Тип дела обязателен")
        CaseType caseType,

        @DecimalMin(value = "0", message = "Сумма не может быть отрицательной")
        BigDecimal amount,

        @Size(max = 10)
        String currency,

        UUID responsibleId,

        UUID lawyerId,

        @Size(max = 500)
        String courtName,

        LocalDate filingDate,

        LocalDate hearingDate
) {
}
