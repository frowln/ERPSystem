package com.privod.platform.modules.permission.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateRecordRuleRequest(
        @NotBlank(message = "Название правила обязательно")
        @Size(max = 200, message = "Название правила не должно превышать 200 символов")
        String name,

        @NotBlank(message = "Имя модели обязательно")
        @Size(max = 100, message = "Имя модели не должно превышать 100 символов")
        String modelName,

        UUID groupId,

        @NotBlank(message = "Фильтр домена обязателен")
        String domainFilter,

        boolean permRead,
        boolean permWrite,
        boolean permCreate,
        boolean permUnlink,
        boolean isGlobal
) {
}
