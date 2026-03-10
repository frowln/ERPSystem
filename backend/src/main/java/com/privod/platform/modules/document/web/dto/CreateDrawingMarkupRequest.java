package com.privod.platform.modules.document.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record CreateDrawingMarkupRequest(
        @NotBlank(message = "Тип разметки обязателен")
        @Size(max = 30)
        String markupType,

        @NotNull(message = "Номер страницы обязателен")
        Integer pageNumber,

        BigDecimal x,
        BigDecimal y,
        BigDecimal width,
        BigDecimal height,
        BigDecimal rotation,

        @Size(max = 7)
        String color,

        Integer strokeWidth,

        String textContent
) {
}
