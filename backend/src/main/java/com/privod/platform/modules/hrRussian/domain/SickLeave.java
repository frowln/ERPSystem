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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "sick_leaves", indexes = {
        @Index(name = "idx_sick_employee", columnList = "employee_id"),
        @Index(name = "idx_sick_status", columnList = "status")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SickLeave extends BaseEntity {

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "sick_leave_number", length = 50)
    private String sickLeaveNumber;

    @Column(name = "diagnosis", length = 500)
    private String diagnosis;

    @Column(name = "is_extension", nullable = false)
    @Builder.Default
    private boolean extension = false;

    @Column(name = "previous_sick_leave_id")
    private UUID previousSickLeaveId;

    @Column(name = "payment_amount", precision = 12, scale = 2)
    private BigDecimal paymentAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private SickLeaveStatus status = SickLeaveStatus.OPEN;

    public int getDaysCount() {
        if (startDate == null || endDate == null) {
            return 0;
        }
        return (int) (endDate.toEpochDay() - startDate.toEpochDay()) + 1;
    }
}
