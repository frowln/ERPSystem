package com.privod.platform.modules.cde.domain;

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
@Table(name = "cde_document_revisions", indexes = {
        @Index(name = "idx_cde_rev_container", columnList = "document_container_id"),
        @Index(name = "idx_cde_rev_status", columnList = "revision_status"),
        @Index(name = "idx_cde_rev_deleted", columnList = "deleted")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentRevision extends BaseEntity {

    @Column(name = "document_container_id", nullable = false)
    private UUID documentContainerId;

    @Column(name = "revision_number", nullable = false, length = 20)
    private String revisionNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "revision_status", nullable = false, length = 20)
    @Builder.Default
    private RevisionStatus revisionStatus = RevisionStatus.CURRENT;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "file_id")
    private UUID fileId;

    @Column(name = "file_name", length = 500)
    private String fileName;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "mime_type", length = 100)
    private String mimeType;

    @Column(name = "uploaded_by_id")
    private UUID uploadedById;

    @Column(name = "uploaded_at")
    private Instant uploadedAt;

    @Column(name = "approved_by_id")
    private UUID approvedById;

    @Column(name = "approved_at")
    private Instant approvedAt;

    @Column(name = "superseded_by_id")
    private UUID supersededById;

    @Column(name = "superseded_at")
    private Instant supersededAt;
}
