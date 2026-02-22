package com.privod.platform.modules.portal.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Filter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "client_progress_snapshots", indexes = {
        @Index(name = "idx_cps_org", columnList = "organization_id"),
        @Index(name = "idx_cps_project", columnList = "project_id"),
        @Index(name = "idx_cps_date", columnList = "snapshot_date")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClientProgressSnapshot extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "snapshot_date", nullable = false)
    private LocalDate snapshotDate;

    @Column(name = "overall_percent", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal overallPercent = BigDecimal.ZERO;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "milestone_summary_json", columnDefinition = "TEXT")
    private String milestoneSummaryJson;

    @Column(name = "photo_report_json", columnDefinition = "TEXT")
    private String photoReportJson;

    @Column(name = "weather_notes", columnDefinition = "TEXT")
    private String weatherNotes;

    @Column(name = "created_by_user_id")
    private UUID createdByUserId;

    @Column(name = "is_published", nullable = false)
    @Builder.Default
    private boolean published = false;

    @Column(name = "published_at")
    private Instant publishedAt;
}
