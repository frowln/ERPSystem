package com.privod.platform.modules.legal.web.dto;

import com.privod.platform.modules.legal.domain.DecisionType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateLegalDecisionRequest(
        @NotNull(message = "Идентификатор дела обязателен")
        UUID caseId,

        @NotNull(message = "Дата решения обязательна")
        LocalDate decisionDate,

        @NotNull(message = "Тип решения обязателен")
        DecisionType decisionType,

        String summary,

        @DecimalMin(value = "0", message = "Сумма не может быть отрицательной")
        BigDecimal amount,

        Boolean enforceable,

        LocalDate enforcementDeadline,

        @Size(max = 1000)
        String fileUrl
) {
}
