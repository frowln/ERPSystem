package com.privod.platform.modules.hrRussian.domain;

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
import org.hibernate.annotations.Filter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "hr_timesheet_entries", indexes = {
        @Index(name = "idx_ts_entry_employee", columnList = "employee_id"),
        @Index(name = "idx_ts_entry_project", columnList = "project_id"),
        @Index(name = "idx_ts_entry_date", columnList = "date"),
        @Index(name = "idx_ts_entry_status", columnList = "status")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HrTimesheetEntry extends BaseEntity {

    @Column(name = "organization_id")
    private UUID organizationId;

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "task_id")
    private UUID taskId;

    @Column(name = "date", nullable = false)
    private LocalDate date;

    @Column(name = "hours", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal hours = BigDecimal.ZERO;

    @Column(name = "overtime_hours", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal overtimeHours = BigDecimal.ZERO;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private TimesheetEntryStatus status = TimesheetEntryStatus.DRAFT;

    @Column(name = "approved_by_id")
    private UUID approvedById;
}
