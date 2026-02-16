package com.privod.platform.modules.portfolio.web.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record CreateBidPackageRequest(
        UUID opportunityId,

        @NotBlank(message = "Наименование проекта обязательно")
        @Size(max = 500, message = "Наименование не должно превышать 500 символов")
        String projectName,

        @Size(max = 100)
        String bidNumber,

        @Size(max = 500)
        String clientOrganization,

        LocalDateTime submissionDeadline,

        @DecimalMin(value = "0", message = "Сумма заявки не может быть отрицательной")
        BigDecimal bidAmount,

        @DecimalMin(value = "0", message = "Оценочная стоимость не может быть отрицательной")
        BigDecimal estimatedCost,

        BigDecimal estimatedMargin,

        UUID bidManagerId,

        UUID technicalLeadId,

        Boolean bondRequired,

        @DecimalMin(value = "0", message = "Сумма обеспечения не может быть отрицательной")
        BigDecimal bondAmount,

        String documents,

        String competitorInfo,

        String notes
) {
}
