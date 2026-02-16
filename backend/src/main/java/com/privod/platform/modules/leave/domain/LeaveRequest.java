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
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "leave_requests", indexes = {
        @Index(name = "idx_leave_request_employee", columnList = "employee_id"),
        @Index(name = "idx_leave_request_type", columnList = "leave_type_id"),
        @Index(name = "idx_leave_request_status", columnList = "status"),
        @Index(name = "idx_leave_request_dates", columnList = "start_date,end_date"),
        @Index(name = "idx_leave_request_approver", columnList = "approver_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaveRequest extends BaseEntity {

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "leave_type_id", nullable = false)
    private UUID leaveTypeId;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "number_of_days", nullable = false, precision = 5, scale = 1)
    private BigDecimal numberOfDays;

    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private LeaveRequestStatus status = LeaveRequestStatus.DRAFT;

    @Column(name = "approver_id")
    private UUID approverId;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "refusal_reason", length = 500)
    private String refusalReason;
}
