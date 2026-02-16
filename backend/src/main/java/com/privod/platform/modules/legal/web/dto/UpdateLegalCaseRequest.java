package com.privod.platform.modules.legal.web.dto;

import com.privod.platform.modules.legal.domain.CaseStatus;
import com.privod.platform.modules.legal.domain.CaseType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record UpdateLegalCaseRequest(
        @Size(max = 100)
        String caseNumber,

        UUID projectId,

        UUID contractId,

        @Size(max = 500)
        String title,

        String description,

        CaseType caseType,

        CaseStatus status,

        @DecimalMin(value = "0", message = "Сумма не может быть отрицательной")
        BigDecimal amount,

        @Size(max = 10)
        String currency,

        UUID responsibleId,

        UUID lawyerId,

        @Size(max = 500)
        String courtName,

        LocalDate filingDate,

        LocalDate hearingDate,

        LocalDate resolutionDate,

        String outcome
) {
}
