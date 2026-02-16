package com.privod.platform.modules.dataExchange.web.dto;

import com.privod.platform.modules.dataExchange.domain.ExportFormat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateExportJobRequest(
        @NotBlank(message = "Тип сущности обязателен")
        @Size(max = 100)
        String entityType,

        @NotNull(message = "Формат экспорта обязателен")
        ExportFormat format,

        @Size(max = 500)
        String fileName,

        String filters,

        UUID requestedById,

        UUID projectId
) {
}
