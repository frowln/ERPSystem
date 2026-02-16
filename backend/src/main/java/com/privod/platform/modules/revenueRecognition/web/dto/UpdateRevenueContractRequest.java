package com.privod.platform.modules.revenueRecognition.web.dto;

import com.privod.platform.modules.revenueRecognition.domain.RecognitionMethod;
import com.privod.platform.modules.revenueRecognition.domain.RecognitionStandard;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record UpdateRevenueContractRequest(
        UUID contractId,

        @Size(max = 500, message = "Наименование договора не должно превышать 500 символов")
        String contractName,

        RecognitionMethod recognitionMethod,

        RecognitionStandard recognitionStandard,

        @DecimalMin(value = "0", message = "Общая сумма выручки не может быть отрицательной")
        BigDecimal totalContractRevenue,

        @DecimalMin(value = "0.01", inclusive = true, message = "Общая сметная стоимость должна быть больше нуля")
        BigDecimal totalEstimatedCost,

        LocalDate startDate,

        LocalDate endDate,

        Boolean isActive
) {
}
