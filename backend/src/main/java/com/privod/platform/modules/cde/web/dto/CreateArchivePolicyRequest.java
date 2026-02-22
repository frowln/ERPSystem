package com.privod.platform.modules.cde.web.dto;

import com.privod.platform.modules.cde.domain.DocumentClassification;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateArchivePolicyRequest(
        @NotBlank(message = "Название политики обязательно")
        @Size(max = 200, message = "Название не должно превышать 200 символов")
        String name,

        String description,

        DocumentClassification classification,

        @Min(value = 1, message = "Срок хранения должен быть не менее 1 дня")
        int retentionDays,

        boolean autoArchive,

        boolean enabled
) {
}
