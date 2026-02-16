package com.privod.platform.modules.costManagement.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.UUID;

public record CreateCommitmentItemRequest(
        @NotBlank(message = "Описание позиции обязательно")
        @Size(max = 500, message = "Описание не должно превышать 500 символов")
        String description,

        UUID costCodeId,

        BigDecimal quantity,

        String unit,

        BigDecimal unitPrice,

        Integer sortOrder
) {
}
