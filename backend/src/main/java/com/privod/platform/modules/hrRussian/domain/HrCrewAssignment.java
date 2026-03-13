package com.privod.platform.modules.hrRussian.domain;

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
import org.hibernate.annotations.Filter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "hr_crew_assignments", indexes = {
        @Index(name = "idx_hr_crew_assign_crew", columnList = "crew_id"),
        @Index(name = "idx_hr_crew_assign_employee", columnList = "employee_id")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HrCrewAssignment extends BaseEntity {

    @Column(name = "organization_id")
    private UUID organizationId;

    @Column(name = "crew_id", nullable = false)
    private UUID crewId;

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "role", length = 200)
    private String role;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "daily_rate", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal dailyRate = BigDecimal.ZERO;

    public boolean isCurrentlyActive() {
        LocalDate today = LocalDate.now();
        return !today.isBefore(startDate) && (endDate == null || !today.isAfter(endDate));
    }
}
