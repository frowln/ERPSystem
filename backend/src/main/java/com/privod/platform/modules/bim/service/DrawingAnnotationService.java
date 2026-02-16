package com.privod.platform.modules.bim.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.bim.domain.AnnotationStatus;
import com.privod.platform.modules.bim.domain.DrawingAnnotation;
import com.privod.platform.modules.bim.repository.DrawingAnnotationRepository;
import com.privod.platform.modules.bim.web.dto.CreateDrawingAnnotationRequest;
import com.privod.platform.modules.bim.web.dto.DrawingAnnotationResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class DrawingAnnotationService {

    private final DrawingAnnotationRepository drawingAnnotationRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<DrawingAnnotationResponse> listAnnotations(UUID drawingId, Pageable pageable) {
        if (drawingId != null) {
            return drawingAnnotationRepository.findByDrawingIdAndDeletedFalse(drawingId, pageable)
                    .map(DrawingAnnotationResponse::fromEntity);
        }
        return drawingAnnotationRepository.findByDeletedFalse(pageable)
                .map(DrawingAnnotationResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public DrawingAnnotationResponse getAnnotation(UUID id) {
        DrawingAnnotation annotation = getAnnotationOrThrow(id);
        return DrawingAnnotationResponse.fromEntity(annotation);
    }

    @Transactional
    public DrawingAnnotationResponse createAnnotation(CreateDrawingAnnotationRequest request) {
        DrawingAnnotation annotation = DrawingAnnotation.builder()
                .drawingId(request.drawingId())
                .authorId(request.authorId())
                .x(request.x())
                .y(request.y())
                .width(request.width() != null ? request.width() : 0.0)
                .height(request.height() != null ? request.height() : 0.0)
                .content(request.content())
                .annotationType(request.annotationType())
                .status(AnnotationStatus.OPEN)
                .build();

        annotation = drawingAnnotationRepository.save(annotation);
        auditService.logCreate("DrawingAnnotation", annotation.getId());

        log.info("Drawing annotation created: {} ({})", annotation.getAnnotationType(), annotation.getId());
        return DrawingAnnotationResponse.fromEntity(annotation);
    }

    @Transactional
    public DrawingAnnotationResponse updateAnnotation(UUID id, CreateDrawingAnnotationRequest request) {
        DrawingAnnotation annotation = getAnnotationOrThrow(id);

        annotation.setDrawingId(request.drawingId());
        annotation.setAuthorId(request.authorId());
        annotation.setX(request.x());
        annotation.setY(request.y());
        annotation.setWidth(request.width() != null ? request.width() : 0.0);
        annotation.setHeight(request.height() != null ? request.height() : 0.0);
        annotation.setContent(request.content());
        annotation.setAnnotationType(request.annotationType());

        annotation = drawingAnnotationRepository.save(annotation);
        auditService.logUpdate("DrawingAnnotation", annotation.getId(), "multiple", null, null);

        log.info("Drawing annotation updated: {} ({})", annotation.getAnnotationType(), annotation.getId());
        return DrawingAnnotationResponse.fromEntity(annotation);
    }

    @Transactional
    public DrawingAnnotationResponse resolveAnnotation(UUID id, UUID resolvedById) {
        DrawingAnnotation annotation = getAnnotationOrThrow(id);

        if (annotation.getStatus() != AnnotationStatus.OPEN) {
            throw new IllegalStateException(
                    String.format("Решить можно только открытую аннотацию, текущий статус: '%s'",
                            annotation.getStatus().getDisplayName()));
        }

        AnnotationStatus oldStatus = annotation.getStatus();
        annotation.setStatus(AnnotationStatus.RESOLVED);
        annotation.setResolvedById(resolvedById);
        annotation.setResolvedAt(Instant.now());

        annotation = drawingAnnotationRepository.save(annotation);
        auditService.logStatusChange("DrawingAnnotation", annotation.getId(),
                oldStatus.name(), AnnotationStatus.RESOLVED.name());

        log.info("Drawing annotation resolved: ({})", annotation.getId());
        return DrawingAnnotationResponse.fromEntity(annotation);
    }

    @Transactional
    public void deleteAnnotation(UUID id) {
        DrawingAnnotation annotation = getAnnotationOrThrow(id);
        annotation.softDelete();
        drawingAnnotationRepository.save(annotation);
        auditService.logDelete("DrawingAnnotation", annotation.getId());

        log.info("Drawing annotation deleted: ({})", annotation.getId());
    }

    private DrawingAnnotation getAnnotationOrThrow(UUID id) {
        return drawingAnnotationRepository.findById(id)
                .filter(a -> !a.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Аннотация не найдена: " + id));
    }
}
