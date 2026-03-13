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
        BigDecimal nightPay,          // ст.154 ТК РФ: доплата за ночные часы (+20%)
        BigDecimal holidayPay,        // ст.153 ТК РФ: доплата за праздники/выходные (×2)
        BigDecimal grossPay,
        BigDecimal taxDeduction,      // НДФЛ 13% — удерживается у сотрудника
        BigDecimal pensionDeduction,  // ОПС 22% — взнос работодателя (не вычитается из netPay)
        BigDecimal socialDeduction,   // ОСС 2.9% — взнос работодателя
        BigDecimal medicalDeduction,  // ОМС 5.1% — взнос работодателя
        BigDecimal totalDeductions,   // только НДФЛ (что реально удержано у сотрудника)
        BigDecimal employerContributions, // итого страховых взносов работодателя
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
                c.getNightPay(),
                c.getHolidayPay(),
                c.getGrossPay(),
                c.getTaxDeduction(),
                c.getPensionDeduction(),
                c.getSocialDeduction(),
                c.getMedicalDeduction(),
                c.getTotalDeductions(),
                c.getEmployerContributions(),
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
