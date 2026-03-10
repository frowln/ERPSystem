package com.privod.platform.modules.document.web.dto;

import com.privod.platform.modules.document.domain.DrawingMarkup;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record DrawingMarkupResponse(
        UUID id,
        UUID documentId,
        Integer pageNumber,
        String markupType,
        BigDecimal x,
        BigDecimal y,
        BigDecimal width,
        BigDecimal height,
        BigDecimal rotation,
        String color,
        Integer strokeWidth,
        String textContent,
        String authorName,
        String status,
        Instant createdAt,
        Instant updatedAt
) {
    public static DrawingMarkupResponse fromEntity(DrawingMarkup markup) {
        return new DrawingMarkupResponse(
                markup.getId(),
                markup.getDocumentId(),
                markup.getPageNumber(),
                markup.getMarkupType(),
                markup.getX(),
                markup.getY(),
                markup.getWidth(),
                markup.getHeight(),
                markup.getRotation(),
                markup.getColor(),
                markup.getStrokeWidth(),
                markup.getTextContent(),
                markup.getAuthorName(),
                markup.getStatus(),
                markup.getCreatedAt(),
                markup.getUpdatedAt()
        );
    }
}
