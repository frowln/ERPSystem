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
@Table(name = "business_trips", indexes = {
        @Index(name = "idx_trip_employee", columnList = "employee_id"),
        @Index(name = "idx_trip_status", columnList = "status")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BusinessTrip extends BaseEntity {

    @Column(name = "organization_id")
    private UUID organizationId;

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "destination", nullable = false, length = 500)
    private String destination;

    @Column(name = "purpose", nullable = false, columnDefinition = "TEXT")
    private String purpose;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "daily_allowance", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal dailyAllowance = BigDecimal.ZERO;

    @Column(name = "total_budget", precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal totalBudget = BigDecimal.ZERO;

    @Column(name = "order_id")
    private UUID orderId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private BusinessTripStatus status = BusinessTripStatus.PLANNED;

    @Column(name = "report_date")
    private LocalDate reportDate;

    @Column(name = "report_url", length = 1000)
    private String reportUrl;

    public int getDaysCount() {
        if (startDate == null || endDate == null) {
            return 0;
        }
        return (int) (endDate.toEpochDay() - startDate.toEpochDay()) + 1;
    }
}
