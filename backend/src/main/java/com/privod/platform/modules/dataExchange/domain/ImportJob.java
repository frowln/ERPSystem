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
@Table(name = "import_jobs", indexes = {
        @Index(name = "idx_import_job_entity", columnList = "entity_type"),
        @Index(name = "idx_import_job_status", columnList = "status"),
        @Index(name = "idx_import_job_mapping", columnList = "mapping_id"),
        @Index(name = "idx_import_job_project", columnList = "project_id"),
        @Index(name = "idx_import_job_started_by", columnList = "started_by_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImportJob extends BaseEntity {

    @Column(name = "entity_type", nullable = false, length = 100)
    private String entityType;

    @Column(name = "file_name", nullable = false, length = 500)
    private String fileName;

    @Column(name = "file_size")
    private Long fileSize;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private ImportStatus status = ImportStatus.PENDING;

    @Column(name = "total_rows")
    private Integer totalRows;

    @Column(name = "processed_rows")
    @Builder.Default
    private Integer processedRows = 0;

    @Column(name = "success_rows")
    @Builder.Default
    private Integer successRows = 0;

    @Column(name = "error_rows")
    @Builder.Default
    private Integer errorRows = 0;

    @Column(name = "errors", columnDefinition = "JSONB")
    private String errors;

    @Column(name = "mapping_id")
    private UUID mappingId;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "started_by_id")
    private UUID startedById;

    @Column(name = "project_id")
    private UUID projectId;
}
