package com.privod.platform.modules.contractExt.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import org.hibernate.annotations.Filter;

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
@Table(name = "sla_violations", indexes = {
        @Index(name = "idx_violation_sla", columnList = "sla_id"),
        @Index(name = "idx_violation_status", columnList = "status"),
        @Index(name = "idx_violation_date", columnList = "violation_date")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SlaViolation extends BaseEntity {

    @Column(name = "organization_id")
    private UUID organizationId;

    @Column(name = "sla_id", nullable = false)
    private UUID slaId;

    @Column(name = "violation_date", nullable = false)
    private LocalDate violationDate;

    @Column(name = "actual_value", nullable = false, precision = 18, scale = 4)
    private BigDecimal actualValue;

    @Column(name = "penalty_amount", precision = 18, scale = 2)
    private BigDecimal penaltyAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private ViolationStatus status = ViolationStatus.DETECTED;

    @Column(name = "notified_at")
    private Instant notifiedAt;

    @Column(name = "resolved_at")
    private Instant resolvedAt;
}
