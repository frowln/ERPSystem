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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "kpi_snapshots", indexes = {
        @Index(name = "idx_snapshot_kpi", columnList = "kpi_id"),
        @Index(name = "idx_snapshot_project", columnList = "project_id"),
        @Index(name = "idx_snapshot_date", columnList = "snapshot_date"),
        @Index(name = "idx_snapshot_kpi_date", columnList = "kpi_id, snapshot_date")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KpiSnapshot extends BaseEntity {

    @Column(name = "kpi_id", nullable = false)
    private UUID kpiId;

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "snapshot_date", nullable = false)
    private LocalDate snapshotDate;

    @Column(name = "value", nullable = false, precision = 18, scale = 4)
    private BigDecimal value;

    @Column(name = "target_value", precision = 18, scale = 4)
    private BigDecimal targetValue;

    @Enumerated(EnumType.STRING)
    @Column(name = "trend", nullable = false, length = 10)
    @Builder.Default
    private KpiTrend trend = KpiTrend.STABLE;
}
