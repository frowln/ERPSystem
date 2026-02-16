package com.privod.platform.modules.monteCarlo.domain;

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

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "monte_carlo_simulations", indexes = {
        @Index(name = "idx_mc_sim_project", columnList = "project_id"),
        @Index(name = "idx_mc_sim_status", columnList = "status")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MonteCarloSimulation extends BaseEntity {

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Column(name = "project_id")
    private UUID projectId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private SimulationStatus status = SimulationStatus.DRAFT;

    @Column(name = "iterations", nullable = false)
    @Builder.Default
    private int iterations = 10000;

    @Column(name = "confidence_level", precision = 5, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal confidenceLevel = new BigDecimal("0.85");

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "result_p50_duration")
    private Integer resultP50Duration;

    @Column(name = "result_p85_duration")
    private Integer resultP85Duration;

    @Column(name = "result_p95_duration")
    private Integer resultP95Duration;

    @Column(name = "result_p50_date")
    private LocalDate resultP50Date;

    @Column(name = "result_p85_date")
    private LocalDate resultP85Date;

    @Column(name = "result_p95_date")
    private LocalDate resultP95Date;

    @Column(name = "baseline_start_date")
    private LocalDate baselineStartDate;

    @Column(name = "baseline_duration")
    private Integer baselineDuration;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    public boolean canTransitionTo(SimulationStatus newStatus) {
        return this.status.canTransitionTo(newStatus);
    }
}
