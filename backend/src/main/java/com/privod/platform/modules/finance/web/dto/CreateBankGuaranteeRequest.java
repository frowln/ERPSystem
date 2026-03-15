package com.privod.platform.modules.finance.web.dto;

import com.privod.platform.modules.finance.domain.GuaranteeType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateBankGuaranteeRequest(
        UUID contractId,
        UUID counterpartyId,

        @NotBlank(message = "Наименование банка обязательно")
        String bankName,

        String guaranteeNumber,

        @NotNull(message = "Тип гарантии обязателен")
        GuaranteeType guaranteeType,

        @NotNull(message = "Сумма обязательна")
        BigDecimal amount,

        String currency,
        LocalDate issueDate,

        @NotNull(message = "Дата окончания обязательна")
        LocalDate expiryDate,

        String documentUrl,
        String notes
) {
}
