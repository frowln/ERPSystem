package com.privod.platform.modules.edo.domain;

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

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "edo_send_documents", indexes = {
        @Index(name = "idx_edo_send_doc_source", columnList = "source_type, source_id"),
        @Index(name = "idx_edo_send_doc_config", columnList = "config_id")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EdoDocument extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "config_id")
    private UUID configId;

    @Column(name = "source_type", nullable = false, length = 20)
    private String sourceType;

    @Column(name = "source_id", nullable = false)
    private UUID sourceId;

    @Column(name = "external_id", length = 255)
    private String externalId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private EdoDocumentStatus status = EdoDocumentStatus.DRAFT;

    @Column(name = "counterparty_inn", length = 12)
    private String counterpartyInn;

    @Column(name = "counterparty_name", length = 500)
    private String counterpartyName;

    @Column(name = "sent_at")
    private Instant sentAt;

    @Column(name = "signed_at")
    private Instant signedAt;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;
}
