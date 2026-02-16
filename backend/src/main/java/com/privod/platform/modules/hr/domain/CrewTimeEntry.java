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
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "crew_time_entries", indexes = {
        @Index(name = "idx_cte_crew", columnList = "crew_id"),
        @Index(name = "idx_cte_employee", columnList = "employee_id"),
        @Index(name = "idx_cte_project", columnList = "project_id"),
        @Index(name = "idx_cte_work_date", columnList = "work_date")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CrewTimeEntry extends BaseEntity {

    @Column(name = "crew_id", nullable = false)
    private UUID crewId;

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "work_date", nullable = false)
    private LocalDate workDate;

    @Column(name = "hours_worked", nullable = false, precision = 5, scale = 2)
    private BigDecimal hoursWorked;

    @Column(name = "overtime_hours", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal overtimeHours = BigDecimal.ZERO;

    @Column(name = "activity_type", length = 100)
    private String activityType;

    @Column(name = "notes", length = 1000)
    private String notes;
}
