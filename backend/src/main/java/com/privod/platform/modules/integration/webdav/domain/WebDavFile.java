package com.privod.platform.modules.integration.webdav.domain;

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
@Table(name = "webdav_files", indexes = {
        @Index(name = "idx_webdav_file_remote_path", columnList = "remote_path"),
        @Index(name = "idx_webdav_file_doc", columnList = "local_document_id"),
        @Index(name = "idx_webdav_file_org", columnList = "organization_id"),
        @Index(name = "idx_webdav_file_status", columnList = "sync_status"),
        @Index(name = "idx_webdav_file_synced", columnList = "last_synced_at"),
        @Index(name = "idx_webdav_file_name", columnList = "file_name")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WebDavFile extends BaseEntity {

    @Column(name = "remote_path", nullable = false, length = 2000)
    private String remotePath;

    @Column(name = "local_document_id")
    private UUID localDocumentId;

    @Column(name = "organization_id")
    private UUID organizationId;

    @Column(name = "file_name", nullable = false, length = 500)
    private String fileName;

    @Column(name = "file_size_bytes")
    private Long fileSizeBytes;

    @Column(name = "content_type", length = 255)
    private String contentType;

    @Enumerated(EnumType.STRING)
    @Column(name = "sync_status", nullable = false, length = 20)
    @Builder.Default
    private WebDavSyncStatus syncStatus = WebDavSyncStatus.PENDING_UPLOAD;

    @Column(name = "last_synced_at")
    private Instant lastSyncedAt;

    @Column(name = "remote_last_modified")
    private Instant remoteLastModified;

    @Column(name = "checksum", length = 64)
    private String checksum;
}
