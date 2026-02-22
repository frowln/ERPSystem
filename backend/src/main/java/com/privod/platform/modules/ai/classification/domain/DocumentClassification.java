package com.privod.platform.modules.ai.classification.domain;

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
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "document_classifications", indexes = {
        @Index(name = "idx_doc_class_org", columnList = "organization_id"),
        @Index(name = "idx_doc_class_org_doc", columnList = "organization_id, document_id"),
        @Index(name = "idx_doc_class_detected_type", columnList = "detected_type"),
        @Index(name = "idx_doc_class_confirmed", columnList = "is_confirmed")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentClassification extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "document_id", nullable = false)
    private UUID documentId;

    @Enumerated(EnumType.STRING)
    @Column(name = "detected_type", nullable = false, length = 30)
    private DocumentClassType detectedType;

    @Column(name = "confidence_percent", nullable = false)
    private Integer confidencePercent;

    @Column(name = "is_confirmed", nullable = false)
    @Builder.Default
    private boolean confirmed = false;

    @Column(name = "confirmed_by_user_id")
    private UUID confirmedByUserId;

    @Column(name = "confirmed_at")
    private Instant confirmedAt;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "raw_ocr_text", columnDefinition = "jsonb")
    private Map<String, Object> rawOcrText;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "extracted_metadata_json", columnDefinition = "jsonb")
    private Map<String, Object> extractedMetadataJson;
}
