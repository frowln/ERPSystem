package com.privod.platform.modules.design.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateDesignSectionRequest(
        @NotNull(message = "ID проекта обязателен")
        UUID projectId,

        @NotBlank(message = "Название обязательно")
        @Size(max = 300, message = "Название не должно превышать 300 символов")
        String name,

        @NotBlank(message = "Код обязателен")
        @Size(max = 50, message = "Код не должен превышать 50 символов")
        String code,

        @Size(max = 100, message = "Дисциплина не должна превышать 100 символов")
        String discipline,

        UUID parentId,
        Integer sequence,
        String description
) {
}
