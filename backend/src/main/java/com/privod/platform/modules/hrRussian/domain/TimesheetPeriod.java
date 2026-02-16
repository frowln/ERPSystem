package com.privod.platform.modules.hrRussian.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "timesheet_periods", indexes = {
        @Index(name = "idx_ts_period_employee", columnList = "employee_id"),
        @Index(name = "idx_ts_period_status", columnList = "status")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uq_ts_period_employee_month_year",
                columnNames = {"employee_id", "month", "year"})
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TimesheetPeriod extends BaseEntity {

    @Column(name = "month", nullable = false)
    private int month;

    @Column(name = "year", nullable = false)
    private int year;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private TimesheetPeriodStatus status = TimesheetPeriodStatus.OPEN;

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "total_hours", nullable = false, precision = 6, scale = 2)
    @Builder.Default
    private BigDecimal totalHours = BigDecimal.ZERO;

    @Column(name = "approved_by_id")
    private UUID approvedById;
}
