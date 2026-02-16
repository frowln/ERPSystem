package com.privod.platform.modules.russianDoc.domain;

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
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

/**
 * Задача OCR-распознавания документа.
 * Очередь обработки загруженных изображений/PDF для извлечения данных.
 */
@Entity
@Table(name = "ocr_task", indexes = {
        @Index(name = "idx_ocr_task_status", columnList = "status"),
        @Index(name = "idx_ocr_task_project", columnList = "project_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OcrTask extends BaseEntity {

    @Column(name = "file_url", nullable = false, length = 2000)
    private String fileUrl;

    @Column(name = "file_name", nullable = false, length = 500)
    private String fileName;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private OcrTaskStatus status = OcrTaskStatus.PENDING;

    @Column(name = "recognized_text", columnDefinition = "TEXT")
    private String recognizedText;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "recognized_fields", columnDefinition = "jsonb")
    private String recognizedFields;

    @Column(name = "confidence")
    private Double confidence;

    @Column(name = "processed_at")
    private Instant processedAt;

    @Column(name = "organization_id")
    private UUID organizationId;

    @Column(name = "project_id")
    private UUID projectId;
}
