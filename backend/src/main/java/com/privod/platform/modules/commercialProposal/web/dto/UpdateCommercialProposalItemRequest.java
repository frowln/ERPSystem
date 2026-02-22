package com.privod.platform.modules.commercialProposal.web.dto;

import jakarta.validation.constraints.DecimalMin;

import java.math.BigDecimal;

public record UpdateCommercialProposalItemRequest(
        @DecimalMin(value = "0", message = "Себестоимость не может быть отрицательной")
        BigDecimal costPrice,

        @DecimalMin(value = "0", message = "Количество не может быть отрицательным")
        BigDecimal quantity,

        @DecimalMin(value = "0", message = "Торговый коэффициент не может быть отрицательным")
        BigDecimal tradingCoefficient,

        String notes
) {
}
