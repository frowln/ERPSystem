package com.privod.platform.modules.finance.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateCostCodeRequest(
        @NotBlank(message = "Код обязателен")
        @Size(max = 20, message = "Код не должен превышать 20 символов")
        String code,

        @NotBlank(message = "Наименование обязательно")
        @Size(max = 255, message = "Наименование не должно превышать 255 символов")
        String name,

        String description,

        UUID parentId,

        String standard
) {
}
