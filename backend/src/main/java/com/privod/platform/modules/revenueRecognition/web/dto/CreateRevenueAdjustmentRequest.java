package com.privod.platform.modules.revenueRecognition.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record CreateRevenueAdjustmentRequest(
        @NotNull(message = "Идентификатор периода признания обязателен")
        UUID recognitionPeriodId,

        @NotBlank(message = "Тип корректировки обязателен")
        String adjustmentType,

        @NotNull(message = "Сумма корректировки обязательна")
        BigDecimal amount,

        @NotBlank(message = "Причина корректировки обязательна")
        String reason,

        BigDecimal previousValue,

        BigDecimal newValue,

        UUID approvedById
) {
}
