package com.privod.platform.modules.closeout.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateCommissioningTemplateRequest(
        UUID projectId,

        @NotBlank(message = "Название шаблона обязательно")
        @Size(max = 300, message = "Название не должно превышать 300 символов")
        String name,

        @Size(max = 100)
        String system,

        String description,

        String checkItemDefinitions,

        Integer sortOrder
) {
}
