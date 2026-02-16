package com.privod.platform.modules.dataExchange.domain;

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
@Table(name = "export_jobs", indexes = {
        @Index(name = "idx_export_job_entity", columnList = "entity_type"),
        @Index(name = "idx_export_job_status", columnList = "status"),
        @Index(name = "idx_export_job_format", columnList = "format"),
        @Index(name = "idx_export_job_project", columnList = "project_id"),
        @Index(name = "idx_export_job_requested_by", columnList = "requested_by_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExportJob extends BaseEntity {

    @Column(name = "entity_type", nullable = false, length = 100)
    private String entityType;

    @Enumerated(EnumType.STRING)
    @Column(name = "format", length = 20)
    private ExportFormat format;

    @Column(name = "file_name", length = 500)
    private String fileName;

    @Column(name = "filters", columnDefinition = "JSONB")
    private String filters;

    @Column(name = "total_rows")
    private Integer totalRows;

    @Column(name = "status", length = 30)
    private String status;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "file_url", length = 1000)
    private String fileUrl;

    @Column(name = "requested_by_id")
    private UUID requestedById;

    @Column(name = "project_id")
    private UUID projectId;
}
