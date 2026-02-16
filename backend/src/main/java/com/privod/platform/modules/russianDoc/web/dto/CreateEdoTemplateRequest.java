package com.privod.platform.modules.russianDoc.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateEdoTemplateRequest(
        @NotBlank(message = "Код шаблона обязателен")
        @Size(max = 100)
        String code,

        @NotBlank(message = "Название шаблона обязательно")
        @Size(max = 500)
        String name,

        @NotBlank(message = "Тип документа обязателен")
        @Size(max = 100)
        String documentType,

        @NotBlank(message = "XML-шаблон обязателен")
        String templateXml
) {
}
