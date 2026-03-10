package com.privod.platform.modules.finance.web.dto;

import jakarta.validation.constraints.Size;

public record UpdateCostCodeRequest(
        @Size(max = 255, message = "Наименование не должно превышать 255 символов")
        String name,

        String description,

        Boolean isActive
) {
}
