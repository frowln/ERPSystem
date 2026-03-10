package com.privod.platform.modules.hr.domain;

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
@Table(name = "hr_timesheet_t13_cells", indexes = {
        @Index(name = "idx_t13_project_month", columnList = "project_id, month, year"),
        @Index(name = "idx_t13_employee", columnList = "employee_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TimesheetT13Cell extends BaseEntity {

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "month", nullable = false)
    private int month;

    @Column(name = "year", nullable = false)
    private int year;

    @Column(name = "day", nullable = false)
    private int day;

    @Column(name = "code", length = 10)
    @Builder.Default
    private String code = "Я";

    @Column(name = "day_hours", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal dayHours = BigDecimal.ZERO;

    @Column(name = "night_hours", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal nightHours = BigDecimal.ZERO;
}
