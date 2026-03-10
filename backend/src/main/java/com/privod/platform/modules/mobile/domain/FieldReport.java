package com.privod.platform.modules.mobile.domain;

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
@Table(name = "field_reports", indexes = {
        @Index(name = "idx_fr_project", columnList = "project_id"),
        @Index(name = "idx_fr_author", columnList = "author_id"),
        @Index(name = "idx_fr_status", columnList = "status"),
        @Index(name = "idx_fr_report_date", columnList = "report_date"),
        @Index(name = "idx_fr_number", columnList = "number", unique = true)
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FieldReport extends BaseEntity {

    @Column(name = "number", nullable = false, unique = true, length = 50)
    private String number;

    @Column(name = "title", nullable = false, length = 500)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private FieldReportStatus status = FieldReportStatus.DRAFT;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "author_id", nullable = false)
    private UUID authorId;

    @Column(name = "author_name", length = 255)
    private String authorName;

    @Column(name = "location", length = 500)
    private String location;

    @Column(name = "weather_condition", length = 50)
    private String weatherCondition;

    @Column(name = "temperature")
    private Double temperature;

    @Column(name = "workers_on_site")
    private Integer workersOnSite;

    @Column(name = "report_date", nullable = false)
    private LocalDate reportDate;

    public boolean canTransitionTo(FieldReportStatus target) {
        return this.status.canTransitionTo(target);
    }
}
