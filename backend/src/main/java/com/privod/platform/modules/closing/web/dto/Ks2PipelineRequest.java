package com.privod.platform.modules.closing.web.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.util.UUID;

public record Ks2PipelineRequest(
        @NotNull(message = "ID проекта обязателен")
        UUID projectId,

        UUID contractId,

        @NotNull(message = "Период обязателен")
        @Pattern(regexp = "\\d{4}-\\d{2}", message = "Период должен быть в формате YYYY-MM")
        String yearMonth
) {
}
