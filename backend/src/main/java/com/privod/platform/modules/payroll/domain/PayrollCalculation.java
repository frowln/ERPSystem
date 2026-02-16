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
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "payroll_calculations", indexes = {
        @Index(name = "idx_payroll_calc_template", columnList = "template_id"),
        @Index(name = "idx_payroll_calc_employee", columnList = "employee_id"),
        @Index(name = "idx_payroll_calc_status", columnList = "status"),
        @Index(name = "idx_payroll_calc_period", columnList = "period_start,period_end")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PayrollCalculation extends BaseEntity {

    @Column(name = "template_id", nullable = false)
    private UUID templateId;

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "period_start", nullable = false)
    private LocalDate periodStart;

    @Column(name = "period_end", nullable = false)
    private LocalDate periodEnd;

    @Column(name = "base_pay", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal basePay = BigDecimal.ZERO;

    @Column(name = "overtime_pay", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal overtimePay = BigDecimal.ZERO;

    @Column(name = "bonus_pay", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal bonusPay = BigDecimal.ZERO;

    @Column(name = "gross_pay", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal grossPay = BigDecimal.ZERO;

    @Column(name = "tax_deduction", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal taxDeduction = BigDecimal.ZERO;

    @Column(name = "pension_deduction", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal pensionDeduction = BigDecimal.ZERO;

    @Column(name = "social_deduction", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal socialDeduction = BigDecimal.ZERO;

    @Column(name = "medical_deduction", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal medicalDeduction = BigDecimal.ZERO;

    @Column(name = "total_deductions", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal totalDeductions = BigDecimal.ZERO;

    @Column(name = "net_pay", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal netPay = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private PayrollCalculationStatus status = PayrollCalculationStatus.DRAFT;

    @Column(name = "approved_by")
    private UUID approvedBy;

    @Column(name = "approved_at")
    private Instant approvedAt;

    public boolean canTransitionTo(PayrollCalculationStatus newStatus) {
        return this.status.canTransitionTo(newStatus);
    }
}
