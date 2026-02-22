package com.privod.platform.modules.commercialProposal.web.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record SelectInvoiceRequest(
        @NotNull(message = "ID строки счёта обязателен")
        UUID invoiceLineId
) {
}
