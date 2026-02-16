package com.privod.platform.modules.selfEmployed.domain;

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
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "self_employed_registries", indexes = {
        @Index(name = "idx_se_registry_project", columnList = "project_id"),
        @Index(name = "idx_se_registry_status", columnList = "status"),
        @Index(name = "idx_se_registry_period", columnList = "period_start,period_end")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SelfEmployedRegistry extends BaseEntity {

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "period_start", nullable = false)
    private LocalDate periodStart;

    @Column(name = "period_end", nullable = false)
    private LocalDate periodEnd;

    @Column(name = "total_amount", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(name = "total_payments")
    @Builder.Default
    private int totalPayments = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private RegistryStatus status = RegistryStatus.DRAFT;

    public boolean canTransitionTo(RegistryStatus newStatus) {
        return this.status.canTransitionTo(newStatus);
    }
}
