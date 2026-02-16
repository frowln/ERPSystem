package com.privod.platform.modules.analytics.domain;

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
import java.util.UUID;

@Entity
@Table(name = "kpi_achievements", indexes = {
        @Index(name = "idx_kpi_ach_employee", columnList = "employee_id"),
        @Index(name = "idx_kpi_ach_kpi", columnList = "kpi_id"),
        @Index(name = "idx_kpi_ach_period", columnList = "period")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KpiAchievement extends BaseEntity {

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "kpi_id", nullable = false)
    private UUID kpiId;

    @Column(name = "period", nullable = false, length = 20)
    private String period;

    @Column(name = "target_value", precision = 18, scale = 4)
    private BigDecimal targetValue;

    @Column(name = "actual_value", precision = 18, scale = 4)
    private BigDecimal actualValue;

    @Column(name = "achievement_percent", precision = 8, scale = 2)
    private BigDecimal achievementPercent;

    @Column(name = "score", precision = 8, scale = 2)
    private BigDecimal score;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
