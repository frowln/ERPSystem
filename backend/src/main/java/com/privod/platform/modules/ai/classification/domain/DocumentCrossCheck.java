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
@Table(name = "document_cross_checks", indexes = {
        @Index(name = "idx_doc_cross_org", columnList = "organization_id"),
        @Index(name = "idx_doc_cross_source", columnList = "organization_id, source_document_id"),
        @Index(name = "idx_doc_cross_target", columnList = "organization_id, target_document_id"),
        @Index(name = "idx_doc_cross_status", columnList = "status")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentCrossCheck extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "source_document_id", nullable = false)
    private UUID sourceDocumentId;

    @Column(name = "target_document_id", nullable = false)
    private UUID targetDocumentId;

    @Enumerated(EnumType.STRING)
    @Column(name = "check_type", nullable = false, length = 30)
    private CrossCheckType checkType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private CrossCheckStatus status;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "discrepancy_details_json", columnDefinition = "jsonb")
    private Map<String, Object> discrepancyDetailsJson;

    @Column(name = "checked_at", nullable = false)
    @Builder.Default
    private Instant checkedAt = Instant.now();
}
