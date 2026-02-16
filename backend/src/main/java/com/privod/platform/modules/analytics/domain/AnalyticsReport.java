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
@Table(name = "analytics_reports", indexes = {
        @Index(name = "idx_analytics_report_type", columnList = "report_type"),
        @Index(name = "idx_analytics_report_category", columnList = "category"),
        @Index(name = "idx_analytics_report_created_by", columnList = "created_by_id"),
        @Index(name = "idx_analytics_report_public", columnList = "is_public")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsReport extends BaseEntity {

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "report_type", nullable = false, length = 20)
    @Builder.Default
    private BiReportType reportType = BiReportType.STANDARD;

    @Column(name = "category", length = 100)
    private String category;

    @Column(name = "query", columnDefinition = "TEXT")
    private String query;

    @Column(name = "parameters", columnDefinition = "JSONB")
    @Builder.Default
    private String parameters = "{}";

    @Enumerated(EnumType.STRING)
    @Column(name = "output_format", nullable = false, length = 10)
    @Builder.Default
    private BiOutputFormat outputFormat = BiOutputFormat.PDF;

    @Column(name = "last_run_at")
    private Instant lastRunAt;

    @Column(name = "run_count", nullable = false)
    @Builder.Default
    private int runCount = 0;

    @Column(name = "created_by_id")
    private UUID createdById;

    @Column(name = "is_public", nullable = false)
    @Builder.Default
    private boolean isPublic = false;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
}
