package com.privod.platform.modules.quality.web.dto;

import com.privod.platform.modules.quality.domain.ChecklistItemResult;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public record ChecklistItemRequest(
        @NotBlank(message = "Наименование пункта обязательно")
        @Size(max = 500, message = "Наименование не должно превышать 500 символов")
        String name,

        String description,

        ChecklistItemResult result,

        String notes,

        List<String> photoUrls,

        int sortOrder,

        boolean required
) {
}
