package com.privod.platform.modules.esg.domain;

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

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "esg_reports", indexes = {
        @Index(name = "idx_er_org", columnList = "organization_id"),
        @Index(name = "idx_er_project", columnList = "project_id"),
        @Index(name = "idx_er_type", columnList = "report_type"),
        @Index(name = "idx_er_status", columnList = "status")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EsgReport extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "project_id")
    private UUID projectId;

    @Enumerated(EnumType.STRING)
    @Column(name = "report_type", nullable = false, length = 30)
    @Builder.Default
    private EsgReportType reportType = EsgReportType.PROJECT;

    @Column(name = "report_period", length = 20)
    private String reportPeriod;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private EsgReportStatus status = EsgReportStatus.DRAFT;

    @Column(name = "title", nullable = false, length = 500)
    private String title;

    @Column(name = "total_carbon", precision = 15, scale = 2)
    private BigDecimal totalCarbon;

    @Column(name = "total_energy", precision = 15, scale = 2)
    private BigDecimal totalEnergy;

    @Column(name = "total_waste", precision = 15, scale = 4)
    private BigDecimal totalWaste;

    @Column(name = "total_water", precision = 15, scale = 2)
    private BigDecimal totalWater;

    @Column(name = "waste_diversion_rate", precision = 5, scale = 2)
    private BigDecimal wasteDiversionRate;

    @Column(name = "carbon_intensity", precision = 10, scale = 2)
    private BigDecimal carbonIntensity;

    @Column(name = "data_json", columnDefinition = "TEXT")
    private String dataJson;

    @Column(name = "carbon_target", precision = 15, scale = 2)
    private BigDecimal carbonTarget;

    @Column(name = "carbon_target_met")
    private Boolean carbonTargetMet;

    @Column(name = "benchmark_json", columnDefinition = "TEXT")
    private String benchmarkJson;

    @Column(name = "generated_at")
    private Instant generatedAt;

    @Column(name = "approved_by")
    private UUID approvedBy;

    @Column(name = "approved_at")
    private Instant approvedAt;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
