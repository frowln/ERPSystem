package com.privod.platform.modules.commercialProposal.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateCommercialProposalRequest(
        @NotNull(message = "ID бюджета обязателен")
        UUID budgetId,

        @NotBlank(message = "Наименование КП обязательно")
        @Size(max = 500, message = "Наименование не должно превышать 500 символов")
        String name,

        String notes
) {
}
