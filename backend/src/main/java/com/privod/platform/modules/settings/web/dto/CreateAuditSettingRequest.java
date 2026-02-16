package com.privod.platform.modules.settings.web.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateAuditSettingRequest(
        @NotBlank(message = "Название модели обязательно")
        @Size(max = 255, message = "Название модели не должно превышать 255 символов")
        String modelName,

        Boolean trackCreate,
        Boolean trackUpdate,
        Boolean trackDelete,
        Boolean trackRead,

        @Min(value = 1, message = "Срок хранения должен быть не менее 1 дня")
        Integer retentionDays
) {
}
