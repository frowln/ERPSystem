package com.privod.platform.modules.subscription.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreateBankInvoiceRequest(
        @NotNull UUID planId,
        @NotBlank String buyerName,
        @NotBlank String buyerInn,
        String buyerKpp,
        String buyerAddress
) {}
