package com.privod.platform.modules.estimate.web.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record ApplyMinstroyIndicesRequest(
        @NotEmpty(message = "Список индексов не должен быть пустым")
        List<@Valid IndexItem> indices
) {
    public record IndexItem(
            @NotNull String region,
            @NotNull Integer quarter,
            @NotNull Integer year,
            @NotNull String indexType,
            @NotNull Double value
    ) {
    }
}
