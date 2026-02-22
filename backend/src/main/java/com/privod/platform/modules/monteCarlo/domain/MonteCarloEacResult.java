package com.privod.platform.modules.monteCarlo.domain;

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
import java.util.UUID;

@Entity
@Table(name = "monte_carlo_eac_results", indexes = {
        @Index(name = "idx_mcer_org", columnList = "organization_id"),
        @Index(name = "idx_mcer_simulation", columnList = "simulation_id"),
        @Index(name = "idx_mcer_project", columnList = "project_id"),
        @Index(name = "idx_mcer_calculated_at", columnList = "calculated_at")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MonteCarloEacResult extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "simulation_id", nullable = false)
    private UUID simulationId;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "iterations", nullable = false)
    @Builder.Default
    private int iterations = 10000;

    // --- Cost forecasts ---

    @Column(name = "cost_p10", precision = 15, scale = 2)
    private BigDecimal costP10;

    @Column(name = "cost_p50", precision = 15, scale = 2)
    private BigDecimal costP50;

    @Column(name = "cost_p90", precision = 15, scale = 2)
    private BigDecimal costP90;

    @Column(name = "cost_mean", precision = 15, scale = 2)
    private BigDecimal costMean;

    @Column(name = "cost_std_dev", precision = 15, scale = 2)
    private BigDecimal costStdDev;

    // --- Schedule forecasts (days) ---

    @Column(name = "schedule_p10")
    private Integer scheduleP10;

    @Column(name = "schedule_p50")
    private Integer scheduleP50;

    @Column(name = "schedule_p90")
    private Integer scheduleP90;

    @Column(name = "schedule_mean", precision = 10, scale = 2)
    private BigDecimal scheduleMean;

    // --- EAC trajectory ---

    @Column(name = "eac_trajectory_json", columnDefinition = "TEXT")
    private String eacTrajectoryJson;

    // --- TCPI ---

    @Column(name = "tcpi_bac", precision = 10, scale = 4)
    private BigDecimal tcpiBac;

    @Column(name = "tcpi_eac", precision = 10, scale = 4)
    private BigDecimal tcpiEac;

    // --- Confidence bands ---

    @Column(name = "confidence_bands_json", columnDefinition = "TEXT")
    private String confidenceBandsJson;

    // --- Natural language insights ---

    @Column(name = "insights_json", columnDefinition = "TEXT")
    private String insightsJson;

    // --- Distribution data for charts ---

    @Column(name = "cost_histogram_json", columnDefinition = "TEXT")
    private String costHistogramJson;

    @Column(name = "schedule_histogram_json", columnDefinition = "TEXT")
    private String scheduleHistogramJson;

    // --- Calculated at ---

    @Column(name = "calculated_at", nullable = false)
    @Builder.Default
    private Instant calculatedAt = Instant.now();
}
