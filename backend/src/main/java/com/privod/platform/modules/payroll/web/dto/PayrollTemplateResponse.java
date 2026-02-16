package com.privod.platform.modules.payroll.web.dto;

import com.privod.platform.modules.payroll.domain.PayrollTemplate;
import com.privod.platform.modules.payroll.domain.PayrollType;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record PayrollTemplateResponse(
        UUID id,
        String name,
        String code,
        String description,
        PayrollType type,
        String typeDisplayName,
        BigDecimal baseSalary,
        BigDecimal hourlyRate,
        BigDecimal overtimeMultiplier,
        BigDecimal bonusPercentage,
        BigDecimal taxRate,
        BigDecimal pensionRate,
        BigDecimal socialRate,
        BigDecimal medicalRate,
        String currency,
        boolean isActive,
        UUID projectId,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static PayrollTemplateResponse fromEntity(PayrollTemplate t) {
        return new PayrollTemplateResponse(
                t.getId(),
                t.getName(),
                t.getCode(),
                t.getDescription(),
                t.getType(),
                t.getType().getDisplayName(),
                t.getBaseSalary(),
                t.getHourlyRate(),
                t.getOvertimeMultiplier(),
                t.getBonusPercentage(),
                t.getTaxRate(),
                t.getPensionRate(),
                t.getSocialRate(),
                t.getMedicalRate(),
                t.getCurrency(),
                t.isActive(),
                t.getProjectId(),
                t.getCreatedAt(),
                t.getUpdatedAt(),
                t.getCreatedBy()
        );
    }
}
