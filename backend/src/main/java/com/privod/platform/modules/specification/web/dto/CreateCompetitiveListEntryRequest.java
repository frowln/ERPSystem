package com.privod.platform.modules.specification.web.dto;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record CreateCompetitiveListEntryRequest(
        @NotNull(message = "Идентификатор позиции спецификации обязателен")
        UUID specItemId,

        UUID vendorId,

        String vendorName,

        BigDecimal unitPrice,

        BigDecimal quantity,

        Integer deliveryDays,

        String paymentTerms,

        String notes
) {
}
