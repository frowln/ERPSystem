package com.privod.platform.modules.quality.web.dto;

import com.privod.platform.modules.quality.domain.ChecklistWorkType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record CreateChecklistTemplateRequest(
        @NotBlank(message = "Наименование шаблона обязательно")
        String name,

        @NotNull(message = "Тип работ обязателен")
        ChecklistWorkType workType,

        List<Object> items
) {
}
