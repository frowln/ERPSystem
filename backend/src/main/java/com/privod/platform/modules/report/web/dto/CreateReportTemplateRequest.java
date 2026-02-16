package com.privod.platform.modules.report.web.dto;

import com.privod.platform.modules.report.domain.Orientation;
import com.privod.platform.modules.report.domain.PaperSize;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateReportTemplateRequest(
        @NotBlank(message = "Код шаблона обязателен")
        @Size(max = 50, message = "Код шаблона не должен превышать 50 символов")
        String code,

        @NotBlank(message = "Название шаблона обязательно")
        @Size(max = 255, message = "Название шаблона не должно превышать 255 символов")
        String name,

        @NotBlank(message = "Тип отчета обязателен")
        String reportType,

        @NotBlank(message = "HTML шаблон обязателен")
        String templateHtml,

        String headerHtml,
        String footerHtml,
        PaperSize paperSize,
        Orientation orientation,
        Integer marginTop,
        Integer marginBottom,
        Integer marginLeft,
        Integer marginRight
) {
}
