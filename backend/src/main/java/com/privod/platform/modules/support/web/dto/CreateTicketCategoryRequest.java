package com.privod.platform.modules.support.web.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.UUID;

public record CreateTicketCategoryRequest(
        @NotBlank(message = "Код категории обязателен")
        String code,

        @NotBlank(message = "Название категории обязательно")
        String name,

        String description,
        UUID defaultAssigneeId,
        Integer slaHours
) {
}
