package com.privod.platform.modules.portal.domain;

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

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "portal_documents", indexes = {
        @Index(name = "idx_portal_doc_user", columnList = "portal_user_id"),
        @Index(name = "idx_portal_doc_project", columnList = "project_id"),
        @Index(name = "idx_portal_doc_document", columnList = "document_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PortalDocument extends BaseEntity {

    @Column(name = "portal_user_id", nullable = false)
    private UUID portalUserId;

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "document_id", nullable = false)
    private UUID documentId;

    @Column(name = "shared_by_id")
    private UUID sharedById;

    @Column(name = "shared_at", nullable = false)
    @Builder.Default
    private Instant sharedAt = Instant.now();

    @Column(name = "expires_at")
    private Instant expiresAt;

    @Column(name = "download_count", nullable = false)
    @Builder.Default
    private Integer downloadCount = 0;

    public void incrementDownloadCount() {
        this.downloadCount++;
    }

    public boolean isExpired() {
        return expiresAt != null && Instant.now().isAfter(expiresAt);
    }
}
