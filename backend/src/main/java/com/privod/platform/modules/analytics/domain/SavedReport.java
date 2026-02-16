package com.privod.platform.modules.analytics.domain;

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
@Table(name = "saved_reports", indexes = {
        @Index(name = "idx_report_code", columnList = "code", unique = true),
        @Index(name = "idx_report_type", columnList = "report_type"),
        @Index(name = "idx_report_created_by", columnList = "created_by_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SavedReport extends BaseEntity {

    @Column(name = "code", unique = true, length = 20)
    private String code;

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "report_type", nullable = false, length = 30)
    private ReportType reportType;

    @Column(name = "query_config", columnDefinition = "JSONB")
    @Builder.Default
    private String queryConfig = "{}";

    @Enumerated(EnumType.STRING)
    @Column(name = "output_format", nullable = false, length = 10)
    @Builder.Default
    private OutputFormat outputFormat = OutputFormat.PDF;

    @Column(name = "schedule_enabled", nullable = false)
    @Builder.Default
    private boolean scheduleEnabled = false;

    @Column(name = "schedule_cron", length = 100)
    private String scheduleCron;

    @Column(name = "schedule_recipients", columnDefinition = "JSONB")
    @Builder.Default
    private String scheduleRecipients = "[]";

    @Column(name = "last_run_at")
    private Instant lastRunAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "last_run_status", length = 20)
    private RunStatus lastRunStatus;

    @Column(name = "created_by_id")
    private UUID createdById;
}
