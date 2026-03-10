package com.privod.platform.modules.document.web.dto;

import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record UpdateDrawingMarkupRequest(
        @Size(max = 30)
        String markupType,

        Integer pageNumber,

        BigDecimal x,
        BigDecimal y,
        BigDecimal width,
        BigDecimal height,
        BigDecimal rotation,

        @Size(max = 7)
        String color,

        Integer strokeWidth,

        String textContent,

        @Size(max = 20)
        String status
) {
}
