package com.privod.platform.modules.portal.web.dto;

import com.privod.platform.modules.portal.domain.ClaimCategory;
import com.privod.platform.modules.portal.domain.ClaimPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateClientClaimRequest(
        @NotNull(message = "ID проекта обязателен")
        UUID projectId,

        @Size(max = 100, message = "Номер помещения не должен превышать 100 символов")
        String unitNumber,

        @NotNull(message = "Категория обязательна")
        ClaimCategory category,

        ClaimPriority priority,

        @NotBlank(message = "Название обязательно")
        @Size(max = 500, message = "Название не должно превышать 500 символов")
        String title,

        @NotBlank(message = "Описание обязательно")
        String description,

        String locationDescription,

        @Size(max = 255, message = "Имя заявителя не должно превышать 255 символов")
        String reportedByName,

        @Size(max = 50, message = "Телефон не должен превышать 50 символов")
        String reportedByPhone,

        @Size(max = 255, message = "Email не должен превышать 255 символов")
        String reportedByEmail
) {
}
