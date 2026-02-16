package com.privod.platform.modules.hrRussian.web.dto;

import com.privod.platform.modules.hrRussian.domain.ContractStatus;
import com.privod.platform.modules.hrRussian.domain.ContractType;
import com.privod.platform.modules.hrRussian.domain.EmploymentContract;
import com.privod.platform.modules.hrRussian.domain.SalaryType;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record EmploymentContractResponse(
        UUID id,
        UUID employeeId,
        String contractNumber,
        ContractType contractType,
        String contractTypeDisplayName,
        LocalDate startDate,
        LocalDate endDate,
        BigDecimal salary,
        SalaryType salaryType,
        String salaryTypeDisplayName,
        String position,
        String department,
        LocalDate probationEndDate,
        String workSchedule,
        ContractStatus status,
        String statusDisplayName,
        boolean onProbation,
        Instant createdAt,
        Instant updatedAt
) {
    public static EmploymentContractResponse fromEntity(EmploymentContract c) {
        return new EmploymentContractResponse(
                c.getId(),
                c.getEmployeeId(),
                c.getContractNumber(),
                c.getContractType(),
                c.getContractType().getDisplayName(),
                c.getStartDate(),
                c.getEndDate(),
                c.getSalary(),
                c.getSalaryType(),
                c.getSalaryType().getDisplayName(),
                c.getPosition(),
                c.getDepartment(),
                c.getProbationEndDate(),
                c.getWorkSchedule(),
                c.getStatus(),
                c.getStatus().getDisplayName(),
                c.isOnProbation(),
                c.getCreatedAt(),
                c.getUpdatedAt()
        );
    }
}
