package com.privod.platform.modules.finance.web.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record ConfirmBankTransactionRequest(
        @NotNull(message = "ID счёта обязателен")
        UUID invoiceId
) {
}
