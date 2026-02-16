package com.privod.platform.modules.pto.domain;

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
@Table(name = "pto_documents", indexes = {
        @Index(name = "idx_pto_doc_project", columnList = "project_id"),
        @Index(name = "idx_pto_doc_status", columnList = "status"),
        @Index(name = "idx_pto_doc_type", columnList = "document_type"),
        @Index(name = "idx_pto_doc_discipline", columnList = "discipline")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PtoDocument extends BaseEntity {

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "code", nullable = false, length = 50, unique = true)
    private String code;

    @Column(name = "title", nullable = false, length = 500)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(name = "document_type", nullable = false, length = 30)
    private PtoDocumentType documentType;

    @Enumerated(EnumType.STRING)
    @Column(name = "discipline", length = 30)
    private Discipline discipline;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private PtoDocumentStatus status = PtoDocumentStatus.DRAFT;

    @Column(name = "current_version", nullable = false)
    @Builder.Default
    private Integer currentVersion = 1;

    @Column(name = "approved_by_id")
    private UUID approvedById;

    @Column(name = "approved_at")
    private Instant approvedAt;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    public boolean canTransitionTo(PtoDocumentStatus newStatus) {
        return this.status.canTransitionTo(newStatus);
    }
}
