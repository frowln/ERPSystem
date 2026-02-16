package com.privod.platform.modules.bidScoring.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateBidComparisonRequest(
        @NotNull(message = "ID проекта обязателен")
        UUID projectId,

        @NotBlank(message = "Наименование сравнения обязательно")
        @Size(max = 500, message = "Наименование не должно превышать 500 символов")
        String title,

        String description,

        @Size(max = 100)
        String rfqNumber,

        String category,

        UUID createdById
) {
}
