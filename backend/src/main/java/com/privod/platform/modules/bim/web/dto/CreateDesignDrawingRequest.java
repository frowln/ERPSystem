package com.privod.platform.modules.bim.web.dto;

import com.privod.platform.modules.bim.domain.DesignDiscipline;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateDesignDrawingRequest(
        @NotNull(message = "Идентификатор пакета обязателен")
        UUID packageId,

        @NotBlank(message = "Номер чертежа обязателен")
        @Size(max = 100, message = "Номер чертежа не должен превышать 100 символов")
        String number,

        @NotBlank(message = "Название чертежа обязательно")
        @Size(max = 500, message = "Название не должно превышать 500 символов")
        String title,

        String revision,
        String scale,
        String format,
        String fileUrl,

        @NotNull(message = "Дисциплина обязательна")
        DesignDiscipline discipline
) {
}
