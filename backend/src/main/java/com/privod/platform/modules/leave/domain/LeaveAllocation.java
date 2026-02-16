package com.privod.platform.modules.leave.domain;

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
import java.util.UUID;

@Entity
@Table(name = "leave_allocations", indexes = {
        @Index(name = "idx_leave_alloc_employee", columnList = "employee_id"),
        @Index(name = "idx_leave_alloc_type", columnList = "leave_type_id"),
        @Index(name = "idx_leave_alloc_year", columnList = "year"),
        @Index(name = "idx_leave_alloc_status", columnList = "status")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaveAllocation extends BaseEntity {

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "leave_type_id", nullable = false)
    private UUID leaveTypeId;

    @Column(name = "allocated_days", nullable = false, precision = 5, scale = 1)
    @Builder.Default
    private BigDecimal allocatedDays = BigDecimal.ZERO;

    @Column(name = "used_days", nullable = false, precision = 5, scale = 1)
    @Builder.Default
    private BigDecimal usedDays = BigDecimal.ZERO;

    @Column(name = "remaining_days", nullable = false, precision = 5, scale = 1)
    @Builder.Default
    private BigDecimal remainingDays = BigDecimal.ZERO;

    @Column(name = "year", nullable = false)
    private int year;

    @Column(name = "notes", length = 1000)
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private LeaveAllocationStatus status = LeaveAllocationStatus.DRAFT;

    public void recalculateRemaining() {
        this.remainingDays = this.allocatedDays.subtract(this.usedDays);
    }
}
