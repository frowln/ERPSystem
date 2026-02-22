package com.privod.platform.modules.compliance.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record CreatePrivacyPolicyRequest(
        @NotBlank(message = "Наименование политики обязательно")
        @Size(max = 500, message = "Наименование не должно превышать 500 символов")
        String title,

        @NotBlank(message = "Содержание политики обязательно")
        String content,

        @NotBlank(message = "Номер версии обязателен")
        @Size(max = 20, message = "Номер версии не должен превышать 20 символов")
        String versionNumber,

        @NotNull(message = "Дата начала действия обязательна")
        LocalDate effectiveFrom,

        LocalDate effectiveTo,

        UUID approvedBy
) {
}
