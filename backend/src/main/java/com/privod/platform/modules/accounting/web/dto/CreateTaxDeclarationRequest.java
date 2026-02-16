package com.privod.platform.modules.accounting.web.dto;

import com.privod.platform.modules.accounting.domain.DeclarationType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record CreateTaxDeclarationRequest(
        @NotNull(message = "Тип декларации обязателен")
        DeclarationType declarationType,

        @NotNull(message = "ID периода обязателен")
        UUID periodId,

        @DecimalMin(value = "0", message = "Сумма не может быть отрицательной")
        BigDecimal amount,

        String notes
) {
}
