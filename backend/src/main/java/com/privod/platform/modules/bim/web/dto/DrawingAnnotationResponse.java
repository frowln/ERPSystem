package com.privod.platform.modules.bim.web.dto;

import com.privod.platform.modules.bim.domain.AnnotationStatus;
import com.privod.platform.modules.bim.domain.AnnotationType;
import com.privod.platform.modules.bim.domain.DrawingAnnotation;

import java.time.Instant;
import java.util.UUID;

public record DrawingAnnotationResponse(
        UUID id,
        UUID drawingId,
        UUID authorId,
        Double x,
        Double y,
        Double width,
        Double height,
        String content,
        AnnotationType annotationType,
        String annotationTypeDisplayName,
        AnnotationStatus status,
        String statusDisplayName,
        UUID resolvedById,
        Instant resolvedAt,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static DrawingAnnotationResponse fromEntity(DrawingAnnotation entity) {
        return new DrawingAnnotationResponse(
                entity.getId(),
                entity.getDrawingId(),
                entity.getAuthorId(),
                entity.getX(),
                entity.getY(),
                entity.getWidth(),
                entity.getHeight(),
                entity.getContent(),
                entity.getAnnotationType(),
                entity.getAnnotationType().getDisplayName(),
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getResolvedById(),
                entity.getResolvedAt(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
