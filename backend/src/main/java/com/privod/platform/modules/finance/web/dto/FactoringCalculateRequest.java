package com.privod.platform.modules.finance.web.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
public class FactoringCalculateRequest {
    @NotEmpty
    private List<UUID> invoiceIds;

    @NotNull
    private BigDecimal rate;

    @NotNull
    private BigDecimal commission;
}
