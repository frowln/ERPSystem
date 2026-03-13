package com.privod.platform.modules.hrRussian.domain;

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
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "crew_time_reports", indexes = {
        @Index(name = "idx_crew_report_crew", columnList = "crew_id"),
        @Index(name = "idx_crew_report_project", columnList = "project_id"),
        @Index(name = "idx_crew_report_date", columnList = "report_date")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CrewTimeReport extends BaseEntity {

    @Column(name = "organization_id")
    private UUID organizationId;

    @Column(name = "crew_id", nullable = false)
    private UUID crewId;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "report_date", nullable = false)
    private LocalDate reportDate;

    @Column(name = "total_hours", nullable = false, precision = 6, scale = 2)
    @Builder.Default
    private BigDecimal totalHours = BigDecimal.ZERO;

    @Column(name = "overtime_hours", nullable = false, precision = 6, scale = 2)
    @Builder.Default
    private BigDecimal overtimeHours = BigDecimal.ZERO;

    @Column(name = "night_hours", nullable = false, precision = 6, scale = 2)
    @Builder.Default
    private BigDecimal nightHours = BigDecimal.ZERO;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "entries", nullable = false, columnDefinition = "jsonb")
    @Builder.Default
    private String entries = "[]";

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private CrewReportStatus status = CrewReportStatus.DRAFT;

    @Column(name = "approved_by_id")
    private UUID approvedById;
}
