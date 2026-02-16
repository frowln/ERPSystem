package com.privod.platform.modules.finance.web.dto;

import com.privod.platform.modules.finance.domain.CashFlowCategory;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateCashFlowEntryRequest(
        UUID projectId,

        @NotNull(message = "Дата записи обязательна")
        LocalDate entryDate,

        @NotNull(message = "Направление обязательно")
        @Pattern(regexp = "in|out", message = "Направление должно быть 'in' или 'out'")
        String direction,

        @NotNull(message = "Категория обязательна")
        CashFlowCategory category,

        @NotNull(message = "Сумма обязательна")
        @DecimalMin(value = "0.01", message = "Сумма должна быть больше нуля")
        BigDecimal amount,

        @Size(max = 500, message = "Описание не должно превышать 500 символов")
        String description,

        UUID paymentId,

        UUID invoiceId,

        String notes
) {
}
