package com.privod.platform.modules.dataExchange.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateImportMappingRequest(
        @NotBlank(message = "Название маппинга обязательно")
        @Size(max = 500)
        String name,

        @NotBlank(message = "Тип сущности обязателен")
        @Size(max = 100)
        String entityType,

        String mappingConfig,

        Boolean isDefault,

        UUID createdById
) {
}
