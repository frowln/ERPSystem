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
@Table(name = "employment_contracts", indexes = {
        @Index(name = "idx_contract_employee", columnList = "employee_id"),
        @Index(name = "idx_empl_contract_status", columnList = "status"),
        @Index(name = "idx_empl_contract_number", columnList = "contract_number")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmploymentContract extends BaseEntity {

    @Column(name = "organization_id")
    private UUID organizationId;

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "contract_number", nullable = false, length = 50)
    private String contractNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "contract_type", nullable = false, length = 30)
    private ContractType contractType;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "salary", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal salary = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "salary_type", nullable = false, length = 20)
    private SalaryType salaryType;

    @Column(name = "position", length = 300)
    private String position;

    @Column(name = "department", length = 300)
    private String department;

    @Column(name = "probation_end_date")
    private LocalDate probationEndDate;

    @Column(name = "work_schedule", length = 200)
    private String workSchedule;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private ContractStatus status = ContractStatus.ACTIVE;

    public boolean isExpired() {
        if (endDate == null) {
            return false;
        }
        return LocalDate.now().isAfter(endDate);
    }

    public boolean isOnProbation() {
        if (probationEndDate == null) {
            return false;
        }
        return !LocalDate.now().isAfter(probationEndDate);
    }
}
