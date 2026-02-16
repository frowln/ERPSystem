package com.privod.platform.modules.dataExchange.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateImportJobRequest(
        @NotBlank(message = "Тип сущности обязателен")
        @Size(max = 100)
        String entityType,

        @NotBlank(message = "Имя файла обязательно")
        @Size(max = 500)
        String fileName,

        Long fileSize,

        Integer totalRows,

        UUID mappingId,

        UUID startedById,

        UUID projectId
) {
}
