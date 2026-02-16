package com.privod.platform.modules.planning.domain;

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
@Table(name = "evm_snapshots", indexes = {
        @Index(name = "idx_evm_project", columnList = "project_id"),
        @Index(name = "idx_evm_snapshot_date", columnList = "snapshot_date"),
        @Index(name = "idx_evm_project_date", columnList = "project_id, snapshot_date")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EvmSnapshot extends BaseEntity {

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "snapshot_date", nullable = false)
    private LocalDate snapshotDate;

    @Column(name = "data_date")
    private LocalDate dataDate;

    @Column(name = "budget_at_completion", precision = 18, scale = 2)
    private BigDecimal budgetAtCompletion;

    @Column(name = "planned_value", precision = 18, scale = 2)
    private BigDecimal plannedValue;

    @Column(name = "earned_value", precision = 18, scale = 2)
    private BigDecimal earnedValue;

    @Column(name = "actual_cost", precision = 18, scale = 2)
    private BigDecimal actualCost;

    @Column(name = "cpi", precision = 8, scale = 4)
    private BigDecimal cpi;

    @Column(name = "spi", precision = 8, scale = 4)
    private BigDecimal spi;

    @Column(name = "eac", precision = 18, scale = 2)
    private BigDecimal eac;

    @Column(name = "etc_value", precision = 18, scale = 2)
    private BigDecimal etcValue;

    @Column(name = "tcpi", precision = 8, scale = 4)
    private BigDecimal tcpi;

    @Column(name = "percent_complete", precision = 5, scale = 2)
    private BigDecimal percentComplete;

    @Column(name = "critical_path_length")
    private Integer criticalPathLength;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
