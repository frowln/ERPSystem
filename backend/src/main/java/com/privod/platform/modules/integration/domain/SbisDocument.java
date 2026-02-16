package com.privod.platform.modules.integration.domain;

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
@Table(name = "sbis_documents", indexes = {
        @Index(name = "idx_sbis_doc_sbis_id", columnList = "sbis_id"),
        @Index(name = "idx_sbis_doc_type", columnList = "document_type"),
        @Index(name = "idx_sbis_doc_internal", columnList = "internal_document_id"),
        @Index(name = "idx_sbis_doc_partner_inn", columnList = "partner_inn"),
        @Index(name = "idx_sbis_doc_direction", columnList = "direction"),
        @Index(name = "idx_sbis_doc_status", columnList = "status"),
        @Index(name = "idx_sbis_doc_sent", columnList = "sent_at")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SbisDocument extends BaseEntity {

    @Column(name = "sbis_id", length = 255)
    private String sbisId;

    @Enumerated(EnumType.STRING)
    @Column(name = "document_type", nullable = false, length = 30)
    private SbisDocumentType documentType;

    @Column(name = "internal_document_id")
    private UUID internalDocumentId;

    @Column(name = "internal_document_model", length = 100)
    private String internalDocumentModel;

    @Column(name = "partner_inn", length = 12)
    private String partnerInn;

    @Column(name = "partner_kpp", length = 9)
    private String partnerKpp;

    @Column(name = "partner_name", length = 500)
    private String partnerName;

    @Enumerated(EnumType.STRING)
    @Column(name = "direction", nullable = false, length = 10)
    private SbisDirection direction;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private SbisDocumentStatus status = SbisDocumentStatus.DRAFT;

    @Column(name = "sent_at")
    private Instant sentAt;

    @Column(name = "received_at")
    private Instant receivedAt;

    @Column(name = "signed_at")
    private Instant signedAt;

    @Column(name = "error_message", length = 2000)
    private String errorMessage;

    @Column(name = "document_data", columnDefinition = "JSONB")
    private String documentData;

    public boolean canTransitionTo(SbisDocumentStatus target) {
        return this.status.canTransitionTo(target);
    }
}
