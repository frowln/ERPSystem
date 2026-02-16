package com.privod.platform.modules.portfolio.web.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record CreateTenderSubmissionRequest(
        @NotNull(message = "ID тендерного пакета обязателен")
        UUID bidPackageId,

        String technicalProposal,

        String commercialSummary,

        @DecimalMin(value = "0", message = "Общая цена не может быть отрицательной")
        BigDecimal totalPrice,

        @DecimalMin(value = "0", message = "Скидка не может быть отрицательной")
        BigDecimal discountPercent,

        BigDecimal finalPrice,

        UUID submittedById,

        String attachmentIds
) {
}
