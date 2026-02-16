package com.privod.platform.modules.portfolio.web.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreatePrequalificationRequest(
        UUID organizationId,

        @NotBlank(message = "Наименование клиента обязательно")
        @Size(max = 500, message = "Наименование клиента не должно превышать 500 символов")
        String clientName,

        @Size(max = 500)
        String projectName,

        LocalDate submissionDate,

        LocalDate expiryDate,

        String categories,

        @DecimalMin(value = "0", message = "Максимальная сумма контракта не может быть отрицательной")
        BigDecimal maxContractValue,

        UUID responsibleId,

        String documents,

        String notes
) {
}
