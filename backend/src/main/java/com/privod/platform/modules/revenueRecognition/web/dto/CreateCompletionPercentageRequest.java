package com.privod.platform.modules.revenueRecognition.web.dto;

import com.privod.platform.modules.revenueRecognition.domain.RecognitionMethod;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateCompletionPercentageRequest(
        @NotNull(message = "Идентификатор договора признания выручки обязателен")
        UUID revenueContractId,

        @NotNull(message = "Дата расчёта обязательна")
        LocalDate calculationDate,

        RecognitionMethod method,

        @DecimalMin(value = "0", message = "Сумма затрат не может быть отрицательной")
        BigDecimal cumulativeCostIncurred,

        @DecimalMin(value = "0.01", inclusive = true, message = "Сметная стоимость должна быть больше нуля")
        BigDecimal totalEstimatedCost,

        @DecimalMin(value = "0", message = "Процент завершения не может быть отрицательным")
        @DecimalMax(value = "100", message = "Процент завершения не может превышать 100")
        BigDecimal physicalPercentComplete,

        String notes,

        UUID calculatedById
) {
}
