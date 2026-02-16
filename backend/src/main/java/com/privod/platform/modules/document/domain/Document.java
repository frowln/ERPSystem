package com.privod.platform.modules.document.domain;

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

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "documents", indexes = {
        @Index(name = "idx_document_org", columnList = "organization_id"),
        @Index(name = "idx_document_org_project", columnList = "organization_id, project_id"),
        @Index(name = "idx_document_project", columnList = "project_id"),
        @Index(name = "idx_document_category", columnList = "category"),
        @Index(name = "idx_document_status", columnList = "status")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Document extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "title", nullable = false, length = 500)
    private String title;

    @Column(name = "document_number", length = 200)
    private String documentNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", length = 30)
    private DocumentCategory category;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private DocumentStatus status = DocumentStatus.DRAFT;

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "contract_id")
    private UUID contractId;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "file_name", length = 500)
    private String fileName;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "mime_type", length = 200)
    private String mimeType;

    @Column(name = "storage_path", length = 1000)
    private String storagePath;

    @Column(name = "doc_version")
    @Builder.Default
    private Integer docVersion = 1;

    @Column(name = "parent_version_id")
    private UUID parentVersionId;

    @Column(name = "author_id")
    private UUID authorId;

    @Column(name = "author_name", length = 255)
    private String authorName;

    @Column(name = "tags", length = 500)
    private String tags;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    public boolean canTransitionTo(DocumentStatus newStatus) {
        return this.status.canTransitionTo(newStatus);
    }
}
