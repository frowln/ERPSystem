package com.privod.platform.modules.settings.web.dto;

import com.privod.platform.modules.settings.domain.ResetPeriod;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public record UpdateNumberSequenceRequest(
        @Size(max = 255, message = "Название не должно превышать 255 символов")
        String name,

        @Size(max = 20, message = "Префикс не должен превышать 20 символов")
        String prefix,

        @Size(max = 20, message = "Суффикс не должен превышать 20 символов")
        String suffix,

        @Min(value = 1, message = "Шаг должен быть не менее 1")
        Integer step,

        @Min(value = 1, message = "Количество цифр должно быть не менее 1")
        Integer padding,

        ResetPeriod resetPeriod
) {
}
