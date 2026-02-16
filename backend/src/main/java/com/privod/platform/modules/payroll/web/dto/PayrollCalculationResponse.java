package com.privod.platform.modules.payroll.web.dto;

import com.privod.platform.modules.payroll.domain.PayrollCalculation;
import com.privod.platform.modules.payroll.domain.PayrollCalculationStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record PayrollCalculationResponse(
        UUID id,
        UUID templateId,
        UUID employeeId,
        LocalDate periodStart,
        LocalDate periodEnd,
        BigDecimal basePay,
        BigDecimal overtimePay,
        BigDecimal bonusPay,
        BigDecimal grossPay,
        BigDecimal taxDeduction,
        BigDecimal pensionDeduction,
        BigDecimal socialDeduction,
        BigDecimal medicalDeduction,
        BigDecimal totalDeductions,
        BigDecimal netPay,
        PayrollCalculationStatus status,
        String statusDisplayName,
        UUID approvedBy,
        Instant approvedAt,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static PayrollCalculationResponse fromEntity(PayrollCalculation c) {
        return new PayrollCalculationResponse(
                c.getId(),
                c.getTemplateId(),
                c.getEmployeeId(),
                c.getPeriodStart(),
                c.getPeriodEnd(),
                c.getBasePay(),
                c.getOvertimePay(),
                c.getBonusPay(),
                c.getGrossPay(),
                c.getTaxDeduction(),
                c.getPensionDeduction(),
                c.getSocialDeduction(),
                c.getMedicalDeduction(),
                c.getTotalDeductions(),
                c.getNetPay(),
                c.getStatus(),
                c.getStatus().getDisplayName(),
                c.getApprovedBy(),
                c.getApprovedAt(),
                c.getCreatedAt(),
                c.getUpdatedAt(),
                c.getCreatedBy()
        );
    }
}
