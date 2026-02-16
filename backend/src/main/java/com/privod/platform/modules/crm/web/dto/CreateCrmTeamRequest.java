package com.privod.platform.modules.crm.web.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.UUID;

public record CreateCrmTeamRequest(
        @NotBlank(message = "Название команды обязательно")
        @Size(max = 200)
        String name,

        UUID leaderId,

        String memberIds,

        @DecimalMin(value = "0", message = "Целевая выручка не может быть отрицательной")
        BigDecimal targetRevenue,

        @Size(max = 20)
        String color
) {
}
