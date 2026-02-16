package com.privod.platform.modules.contractExt.web.dto;

import com.privod.platform.modules.legal.domain.CaseType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateLegalCaseRequest(
        UUID projectId,

        UUID contractId,

        @NotBlank(message = "Номер дела обязателен")
        @Size(max = 100)
        String caseNumber,

        @NotBlank(message = "Наименование суда обязательно")
        @Size(max = 500)
        String courtName,

        @NotBlank(message = "Предмет иска обязателен")
        String title,

        String description,

        @NotNull(message = "Тип дела обязателен")
        CaseType caseType,

        BigDecimal amount,

        String currency,

        LocalDate filingDate,

        LocalDate hearingDate,

        UUID responsibleId,

        UUID lawyerId
) {
}
