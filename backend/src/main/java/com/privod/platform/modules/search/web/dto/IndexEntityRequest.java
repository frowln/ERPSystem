package com.privod.platform.modules.search.web.dto;

import com.privod.platform.modules.search.domain.SearchEntityType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.Map;
import java.util.UUID;

public record IndexEntityRequest(
        @NotNull(message = "Тип сущности обязателен")
        SearchEntityType entityType,

        @NotNull(message = "ID сущности обязателен")
        UUID entityId,

        @NotBlank(message = "Заголовок обязателен")
        @Size(max = 500, message = "Заголовок не должен превышать 500 символов")
        String title,

        String content,
        Map<String, Object> metadata,
        UUID projectId,
        UUID organizationId
) {
}
