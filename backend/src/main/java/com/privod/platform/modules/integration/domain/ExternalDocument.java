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
@Table(name = "external_documents", indexes = {
        @Index(name = "idx_ed_external_id", columnList = "external_id"),
        @Index(name = "idx_ed_provider", columnList = "provider"),
        @Index(name = "idx_ed_document_type", columnList = "document_type"),
        @Index(name = "idx_ed_status", columnList = "status"),
        @Index(name = "idx_ed_sender_inn", columnList = "sender_inn"),
        @Index(name = "idx_ed_recipient_inn", columnList = "recipient_inn"),
        @Index(name = "idx_ed_linked", columnList = "linked_entity_type, linked_entity_id"),
        @Index(name = "idx_ed_received", columnList = "received_at")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExternalDocument extends BaseEntity {

    @Column(name = "external_id", nullable = false, length = 255)
    private String externalId;

    @Enumerated(EnumType.STRING)
    @Column(name = "provider", nullable = false, length = 20)
    private EdoProvider provider;

    @Enumerated(EnumType.STRING)
    @Column(name = "document_type", nullable = false, length = 20)
    private EdoDocumentType documentType;

    @Column(name = "title", nullable = false, length = 500)
    private String title;

    @Column(name = "sender_inn", length = 12)
    private String senderInn;

    @Column(name = "sender_name", length = 500)
    private String senderName;

    @Column(name = "recipient_inn", length = 12)
    private String recipientInn;

    @Column(name = "recipient_name", length = 500)
    private String recipientName;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private ExternalDocumentStatus status = ExternalDocumentStatus.RECEIVED;

    @Enumerated(EnumType.STRING)
    @Column(name = "signature_status", nullable = false, length = 20)
    @Builder.Default
    private SignatureStatus signatureStatus = SignatureStatus.UNSIGNED;

    @Column(name = "file_url", length = 1000)
    private String fileUrl;

    @Column(name = "signed_file_url", length = 1000)
    private String signedFileUrl;

    @Column(name = "linked_entity_type", length = 100)
    private String linkedEntityType;

    @Column(name = "linked_entity_id")
    private UUID linkedEntityId;

    @Column(name = "received_at")
    private Instant receivedAt;

    @Column(name = "signed_at")
    private Instant signedAt;
}
