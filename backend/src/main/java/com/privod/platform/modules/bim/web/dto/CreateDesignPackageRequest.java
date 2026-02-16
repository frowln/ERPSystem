package com.privod.platform.modules.bim.web.dto;

import com.privod.platform.modules.bim.domain.DesignDiscipline;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateDesignPackageRequest(
        @NotNull(message = "Идентификатор проекта обязателен")
        UUID projectId,

        @NotBlank(message = "Название пакета обязательно")
        @Size(max = 500, message = "Название не должно превышать 500 символов")
        String name,

        @NotNull(message = "Дисциплина обязательна")
        DesignDiscipline discipline
) {
}
