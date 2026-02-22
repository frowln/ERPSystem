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
import org.hibernate.annotations.Filter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "report_templates", indexes = {
        @Index(name = "idx_rt_org", columnList = "organization_id"),
        @Index(name = "idx_rt_source", columnList = "data_source"),
        @Index(name = "idx_rt_created_by_id", columnList = "created_by_id")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportTemplate extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "data_source", nullable = false, length = 100)
    private ReportDataSource dataSource;

    @Column(name = "columns_json", columnDefinition = "TEXT")
    @Builder.Default
    private String columnsJson = "[]";

    @Column(name = "filters_json", columnDefinition = "TEXT")
    @Builder.Default
    private String filtersJson = "[]";

    @Column(name = "group_by_json", columnDefinition = "TEXT")
    @Builder.Default
    private String groupByJson = "[]";

    @Column(name = "sort_by_json", columnDefinition = "TEXT")
    @Builder.Default
    private String sortByJson = "[]";

    @Enumerated(EnumType.STRING)
    @Column(name = "chart_type", length = 50)
    @Builder.Default
    private ReportChartType chartType = ReportChartType.NONE;

    @Column(name = "chart_config_json", columnDefinition = "TEXT")
    private String chartConfigJson;

    @Column(name = "is_public", nullable = false)
    @Builder.Default
    private boolean isPublic = false;

    @Column(name = "schedule_enabled", nullable = false)
    @Builder.Default
    private boolean scheduleEnabled = false;

    @Column(name = "schedule_cron", length = 100)
    private String scheduleCron;

    @Column(name = "schedule_recipients", columnDefinition = "TEXT")
    @Builder.Default
    private String scheduleRecipients = "[]";

    @Column(name = "last_run_at")
    private Instant lastRunAt;

    @Column(name = "created_by_id")
    private UUID createdById;
}
