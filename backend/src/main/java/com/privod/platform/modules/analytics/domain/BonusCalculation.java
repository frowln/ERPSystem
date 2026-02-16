package com.privod.platform.modules.analytics.domain;

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
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "bonus_calculations", indexes = {
        @Index(name = "idx_bonus_employee", columnList = "employee_id"),
        @Index(name = "idx_bonus_period", columnList = "period"),
        @Index(name = "idx_bonus_status", columnList = "status")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BonusCalculation extends BaseEntity {

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "employee_name", length = 300)
    private String employeeName;

    @Column(name = "period", nullable = false, length = 20)
    private String period;

    @Column(name = "base_bonus", precision = 18, scale = 2)
    private BigDecimal baseBonus;

    @Column(name = "kpi_multiplier", precision = 8, scale = 4)
    private BigDecimal kpiMultiplier;

    @Column(name = "final_bonus", precision = 18, scale = 2)
    private BigDecimal finalBonus;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private BonusStatus status = BonusStatus.DRAFT;

    @Column(name = "approved_by_id")
    private UUID approvedById;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;
}
