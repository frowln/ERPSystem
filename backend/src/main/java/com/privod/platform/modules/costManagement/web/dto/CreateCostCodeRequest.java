package com.privod.platform.modules.costManagement.web.dto;

import com.privod.platform.modules.costManagement.domain.CostCodeLevel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.UUID;

public record CreateCostCodeRequest(
        @NotNull(message = "Идентификатор проекта обязателен")
        UUID projectId,

        @NotBlank(message = "Код затрат обязателен")
        @Size(max = 50, message = "Код затрат не должен превышать 50 символов")
        String code,

        @NotBlank(message = "Наименование обязательно")
        @Size(max = 500, message = "Наименование не должно превышать 500 символов")
        String name,

        String description,

        UUID parentId,

        CostCodeLevel level,

        BigDecimal budgetAmount
) {
}
