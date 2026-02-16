package com.privod.platform.modules.bim.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "drawing_annotations", indexes = {
        @Index(name = "idx_drawing_annotation_drawing", columnList = "drawing_id"),
        @Index(name = "idx_drawing_annotation_status", columnList = "status")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DrawingAnnotation extends BaseEntity {

    @Column(name = "drawing_id", nullable = false)
    private UUID drawingId;

    @Column(name = "author_id")
    private UUID authorId;

    @Column(name = "x", nullable = false)
    @Builder.Default
    private Double x = 0.0;

    @Column(name = "y", nullable = false)
    @Builder.Default
    private Double y = 0.0;

    @Column(name = "width")
    @Builder.Default
    private Double width = 0.0;

    @Column(name = "height")
    @Builder.Default
    private Double height = 0.0;

    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(name = "annotation_type", nullable = false, length = 30)
    @Builder.Default
    private AnnotationType annotationType = AnnotationType.PIN;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private AnnotationStatus status = AnnotationStatus.OPEN;

    @Column(name = "resolved_by_id")
    private UUID resolvedById;

    @Column(name = "resolved_at")
    private Instant resolvedAt;
}
