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
@Table(name = "vacations", indexes = {
        @Index(name = "idx_vacation_employee", columnList = "employee_id"),
        @Index(name = "idx_vacation_status", columnList = "status")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Vacation extends BaseEntity {

    @Column(name = "organization_id")
    private UUID organizationId;

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Enumerated(EnumType.STRING)
    @Column(name = "vacation_type", nullable = false, length = 30)
    private VacationType vacationType;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "days_count", nullable = false)
    private int daysCount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private VacationStatus status = VacationStatus.PLANNED;

    @Column(name = "order_id")
    private UUID orderId;

    @Column(name = "substituting_employee_id")
    private UUID substitutingEmployeeId;

    // ст.139 ТК РФ — расчёт отпускных
    // Сумма начислений за 12 календарных месяцев, предшествующих отпуску
    @Column(name = "annual_earnings", precision = 18, scale = 2)
    private BigDecimal annualEarnings;

    // Средний дневной заработок = annual_earnings / (12 × 29.3)
    @Column(name = "average_daily_earnings", precision = 18, scale = 4)
    private BigDecimal averageDailyEarnings;

    // Отпускные = averageDailyEarnings × daysCount
    @Column(name = "vacation_pay", precision = 18, scale = 2)
    private BigDecimal vacationPay;

    public boolean isActive() {
        LocalDate today = LocalDate.now();
        return !today.isBefore(startDate) && !today.isAfter(endDate)
                && status == VacationStatus.ACTIVE;
    }
}
