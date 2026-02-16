package com.privod.platform.modules.revenueRecognition.web.dto;

import com.privod.platform.modules.revenueRecognition.domain.RecognitionMethod;
import com.privod.platform.modules.revenueRecognition.domain.RecognitionStandard;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateRevenueContractRequest(
        @NotNull(message = "Идентификатор проекта обязателен")
        UUID projectId,

        UUID contractId,

        @Size(max = 500, message = "Наименование договора не должно превышать 500 символов")
        String contractName,

        RecognitionMethod recognitionMethod,

        RecognitionStandard recognitionStandard,

        @NotNull(message = "Общая сумма выручки по договору обязательна")
        @DecimalMin(value = "0", message = "Общая сумма выручки не может быть отрицательной")
        BigDecimal totalContractRevenue,

        @NotNull(message = "Общая сметная стоимость обязательна")
        @DecimalMin(value = "0.01", inclusive = true, message = "Общая сметная стоимость должна быть больше нуля")
        BigDecimal totalEstimatedCost,

        @NotNull(message = "Идентификатор организации обязателен")
        UUID organizationId,

        LocalDate startDate,

        LocalDate endDate
) {
}
