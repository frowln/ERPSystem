package com.privod.platform.modules.task.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateChecklistItemRequest(
        @NotBlank(message = "Название пункта обязательно")
        @Size(max = 500, message = "Название не должно превышать 500 символов")
        String title,

        Integer sortOrder
) {
}
