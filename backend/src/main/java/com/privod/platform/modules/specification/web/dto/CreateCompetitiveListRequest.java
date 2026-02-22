package com.privod.platform.modules.specification.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreateCompetitiveListRequest(
        @NotNull(message = "Идентификатор спецификации обязателен")
        UUID specificationId,

        @NotBlank(message = "Наименование обязательно")
        String name,

        Integer minProposalsRequired,

        String notes
) {
}
