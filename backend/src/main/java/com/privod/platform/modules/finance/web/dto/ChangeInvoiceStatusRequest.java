package com.privod.platform.modules.finance.web.dto;

import com.privod.platform.modules.finance.domain.InvoiceStatus;
import jakarta.validation.constraints.NotNull;

public record ChangeInvoiceStatusRequest(
        @NotNull InvoiceStatus status
) {
}
