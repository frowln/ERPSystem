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

import java.util.UUID;

@Entity
@Table(name = "monte_carlo_tasks", indexes = {
        @Index(name = "idx_mc_task_simulation", columnList = "simulation_id"),
        @Index(name = "idx_mc_task_wbs_node", columnList = "wbs_node_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MonteCarloTask extends BaseEntity {

    @Column(name = "simulation_id", nullable = false)
    private UUID simulationId;

    @Column(name = "task_name", nullable = false, length = 500)
    private String taskName;

    @Column(name = "wbs_node_id")
    private UUID wbsNodeId;

    @Column(name = "optimistic_duration", nullable = false)
    private int optimisticDuration;

    @Column(name = "most_likely_duration", nullable = false)
    private int mostLikelyDuration;

    @Column(name = "pessimistic_duration", nullable = false)
    private int pessimisticDuration;

    @Enumerated(EnumType.STRING)
    @Column(name = "distribution", nullable = false, length = 20)
    @Builder.Default
    private DistributionType distribution = DistributionType.PERT;

    @Column(name = "dependencies", columnDefinition = "TEXT")
    private String dependencies;
}
