package com.privod.platform.modules.design.domain;

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
@Table(name = "design_versions", indexes = {
        @Index(name = "idx_dv_project", columnList = "project_id"),
        @Index(name = "idx_dv_document", columnList = "document_id"),
        @Index(name = "idx_dv_status", columnList = "status"),
        @Index(name = "idx_dv_discipline", columnList = "discipline")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DesignVersion extends BaseEntity {

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "document_id")
    private UUID documentId;

    @Column(name = "version_number", nullable = false, length = 50)
    private String versionNumber;

    @Column(name = "title", nullable = false, length = 500)
    private String title;

    @Column(name = "discipline", length = 100)
    private String discipline;

    @Column(name = "author", length = 255)
    private String author;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private DesignVersionStatus status = DesignVersionStatus.DRAFT;

    @Column(name = "review_deadline")
    private LocalDate reviewDeadline;

    @Column(name = "file_url", length = 1000)
    private String fileUrl;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "change_description", columnDefinition = "TEXT")
    private String changeDescription;

    public boolean canTransitionTo(DesignVersionStatus newStatus) {
        return this.status.canTransitionTo(newStatus);
    }
}
