package com.privod.platform.modules.portfolio.web.dto;

import com.privod.platform.modules.portfolio.domain.ClientType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateOpportunityRequest(
        UUID organizationId,

        @NotBlank(message = "Наименование возможности обязательно")
        @Size(max = 500, message = "Наименование не должно превышать 500 символов")
        String name,

        String description,

        @Size(max = 500)
        String clientName,

        ClientType clientType,

        @DecimalMin(value = "0", message = "Оценочная стоимость не может быть отрицательной")
        BigDecimal estimatedValue,

        @Min(value = 0, message = "Вероятность должна быть от 0 до 100")
        @Max(value = 100, message = "Вероятность должна быть от 0 до 100")
        Integer probability,

        LocalDate expectedCloseDate,

        UUID ownerId,

        String source,

        String region,

        String projectType,

        String tags
) {
}
