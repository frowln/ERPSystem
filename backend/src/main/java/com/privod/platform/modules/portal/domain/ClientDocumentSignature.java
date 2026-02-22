package com.privod.platform.modules.portal.domain;

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
@Table(name = "client_document_signatures", indexes = {
        @Index(name = "idx_cds_org", columnList = "organization_id"),
        @Index(name = "idx_cds_project", columnList = "project_id"),
        @Index(name = "idx_cds_portal_user", columnList = "portal_user_id"),
        @Index(name = "idx_cds_status", columnList = "signature_status")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClientDocumentSignature extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "portal_user_id", nullable = false)
    private UUID portalUserId;

    @Column(name = "document_id")
    private UUID documentId;

    @Column(name = "document_title", nullable = false, length = 500)
    private String documentTitle;

    @Column(name = "document_url", length = 2000)
    private String documentUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "signature_status", nullable = false, length = 20)
    @Builder.Default
    private SignatureStatus signatureStatus = SignatureStatus.PENDING;

    @Column(name = "signed_at")
    private Instant signedAt;

    @Column(name = "rejected_reason", columnDefinition = "TEXT")
    private String rejectedReason;

    @Column(name = "expires_at")
    private Instant expiresAt;

    @Column(name = "reminder_sent", nullable = false)
    @Builder.Default
    private boolean reminderSent = false;

    public boolean isExpired() {
        return expiresAt != null && Instant.now().isAfter(expiresAt);
    }
}
