package com.privod.platform.modules.russianDoc.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * Шаблон OCR-распознавания.
 * Определяет маппинг полей для конкретного типа документа.
 */
@Entity
@Table(name = "ocr_template", indexes = {
        @Index(name = "idx_ocr_tpl_type", columnList = "document_type"),
        @Index(name = "idx_ocr_tpl_active", columnList = "is_active")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OcrTemplate extends BaseEntity {

    @Column(name = "document_type", nullable = false, length = 100)
    private String documentType;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "field_mappings", nullable = false, columnDefinition = "jsonb")
    private String fieldMappings;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;
}
