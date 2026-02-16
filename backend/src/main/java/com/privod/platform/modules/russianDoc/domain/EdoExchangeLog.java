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

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "edo_exchange_logs", indexes = {
        @Index(name = "idx_edo_exl_document", columnList = "edo_document_id"),
        @Index(name = "idx_edo_exl_action", columnList = "action"),
        @Index(name = "idx_edo_exl_performed_by", columnList = "performed_by_id"),
        @Index(name = "idx_edo_exl_performed_at", columnList = "performed_at")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EdoExchangeLog extends BaseEntity {

    @Column(name = "edo_document_id", nullable = false)
    private UUID edoDocumentId;

    @Enumerated(EnumType.STRING)
    @Column(name = "action", nullable = false, length = 20)
    private EdoAction action;

    @Column(name = "performed_by_id")
    private UUID performedById;

    @Column(name = "performed_at", nullable = false)
    private Instant performedAt;

    @Column(name = "details", columnDefinition = "TEXT")
    private String details;

    @Column(name = "external_id", length = 255)
    private String externalId;
}
