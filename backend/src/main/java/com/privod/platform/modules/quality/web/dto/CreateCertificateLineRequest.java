package com.privod.platform.modules.quality.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateCertificateLineRequest(
        @NotBlank(message = "Наименование параметра обязательно")
        @Size(max = 500, message = "Наименование параметра не должно превышать 500 символов")
        String parameterName,

        @Size(max = 255, message = "Нормативное значение не должно превышать 255 символов")
        String standardValue,

        @Size(max = 255, message = "Фактическое значение не должно превышать 255 символов")
        String actualValue,

        @Size(max = 50, message = "Единица измерения не должна превышать 50 символов")
        String unit,

        Boolean isCompliant,

        @Size(max = 500, message = "Метод испытания не должен превышать 500 символов")
        String testMethod
) {
}
