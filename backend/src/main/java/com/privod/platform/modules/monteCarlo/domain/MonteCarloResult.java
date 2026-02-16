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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "monte_carlo_results", indexes = {
        @Index(name = "idx_mc_result_simulation", columnList = "simulation_id"),
        @Index(name = "idx_mc_result_percentile", columnList = "percentile")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MonteCarloResult extends BaseEntity {

    @Column(name = "simulation_id", nullable = false)
    private UUID simulationId;

    @Column(name = "percentile", nullable = false)
    private int percentile;

    @Column(name = "duration_days", nullable = false)
    private int durationDays;

    @Column(name = "completion_date")
    private LocalDate completionDate;

    @Column(name = "probability", precision = 5, scale = 4)
    private BigDecimal probability;
}
