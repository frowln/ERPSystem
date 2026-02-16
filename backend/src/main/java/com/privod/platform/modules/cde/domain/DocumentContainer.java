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

import java.util.UUID;

@Entity
@Table(name = "cde_document_containers", indexes = {
        @Index(name = "idx_cde_doc_project", columnList = "project_id"),
        @Index(name = "idx_cde_doc_state", columnList = "lifecycle_state"),
        @Index(name = "idx_cde_doc_classification", columnList = "classification"),
        @Index(name = "idx_cde_doc_discipline", columnList = "discipline"),
        @Index(name = "idx_cde_doc_deleted", columnList = "deleted")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentContainer extends BaseEntity {

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "document_number", nullable = false, length = 100)
    private String documentNumber;

    @Column(name = "title", nullable = false, length = 500)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "classification", length = 30)
    private DocumentClassification classification;

    @Enumerated(EnumType.STRING)
    @Column(name = "lifecycle_state", nullable = false, length = 20)
    @Builder.Default
    private DocumentLifecycleState lifecycleState = DocumentLifecycleState.WIP;

    @Column(name = "discipline", length = 100)
    private String discipline;

    @Column(name = "zone", length = 100)
    private String zone;

    @Column(name = "level", length = 50)
    private String level;

    @Column(name = "originator_code", length = 50)
    private String originatorCode;

    @Column(name = "type_code", length = 50)
    private String typeCode;

    @Column(name = "current_revision_id")
    private UUID currentRevisionId;

    @Column(name = "metadata", columnDefinition = "JSONB")
    private String metadata;

    @Column(name = "tags", columnDefinition = "JSONB")
    private String tags;

    public boolean canTransitionTo(DocumentLifecycleState newState) {
        return this.lifecycleState.canTransitionTo(newState);
    }
}
