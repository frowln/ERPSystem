package com.privod.platform.modules.ops.domain;

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
@Table(name = "daily_reports", indexes = {
        @Index(name = "idx_dr_work_order", columnList = "work_order_id"),
        @Index(name = "idx_dr_report_date", columnList = "report_date"),
        @Index(name = "idx_dr_submitted_by", columnList = "submitted_by_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyReport extends BaseEntity {

    @Column(name = "work_order_id", nullable = false)
    private UUID workOrderId;

    @Column(name = "report_date", nullable = false)
    private LocalDate reportDate;

    @Column(name = "work_done", columnDefinition = "TEXT")
    private String workDone;

    @Column(name = "issues", columnDefinition = "TEXT")
    private String issues;

    @Column(name = "materials_used", columnDefinition = "JSONB")
    private String materialsUsed;

    @Column(name = "labor_hours", precision = 8, scale = 2)
    @Builder.Default
    private BigDecimal laborHours = BigDecimal.ZERO;

    @Column(name = "equipment_hours", precision = 8, scale = 2)
    @Builder.Default
    private BigDecimal equipmentHours = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "weather_impact", length = 30)
    private WeatherImpact weatherImpact;

    @Column(name = "submitted_by_id")
    private UUID submittedById;
}
