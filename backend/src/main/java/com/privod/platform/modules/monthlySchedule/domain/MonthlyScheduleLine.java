package com.privod.platform.modules.monthlySchedule.domain;

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
@Table(name = "monthly_schedule_lines", indexes = {
        @Index(name = "idx_msl_schedule", columnList = "schedule_id"),
        @Index(name = "idx_msl_dates", columnList = "start_date, end_date")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyScheduleLine extends BaseEntity {

    @Column(name = "schedule_id", nullable = false)
    private UUID scheduleId;

    @Column(name = "work_name", nullable = false, length = 500)
    private String workName;

    @Column(name = "unit", length = 50)
    private String unit;

    @Column(name = "planned_volume", precision = 18, scale = 4)
    private BigDecimal plannedVolume;

    @Column(name = "actual_volume", precision = 18, scale = 4)
    private BigDecimal actualVolume;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "responsible", length = 300)
    private String responsible;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
