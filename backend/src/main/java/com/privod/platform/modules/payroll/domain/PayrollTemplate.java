package com.privod.platform.modules.payroll.domain;

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
import java.util.UUID;

@Entity
@Table(name = "payroll_templates", indexes = {
        @Index(name = "idx_payroll_tpl_project", columnList = "project_id"),
        @Index(name = "idx_payroll_tpl_type", columnList = "type"),
        @Index(name = "idx_payroll_tpl_code", columnList = "code", unique = true),
        @Index(name = "idx_payroll_tpl_active", columnList = "is_active")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PayrollTemplate extends BaseEntity {

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Column(name = "code", unique = true, length = 50)
    private String code;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 20)
    private PayrollType type;

    @Column(name = "base_salary", precision = 18, scale = 2)
    private BigDecimal baseSalary;

    @Column(name = "hourly_rate", precision = 18, scale = 2)
    private BigDecimal hourlyRate;

    @Column(name = "overtime_multiplier", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal overtimeMultiplier = new BigDecimal("1.50");

    @Column(name = "bonus_percentage", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal bonusPercentage = BigDecimal.ZERO;

    @Column(name = "tax_rate", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal taxRate = new BigDecimal("13.00");

    @Column(name = "pension_rate", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal pensionRate = new BigDecimal("22.00");

    @Column(name = "social_rate", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal socialRate = new BigDecimal("2.90");

    @Column(name = "medical_rate", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal medicalRate = new BigDecimal("5.10");

    @Column(name = "currency", length = 3, nullable = false)
    @Builder.Default
    private String currency = "RUB";

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @Column(name = "project_id")
    private UUID projectId;
}
