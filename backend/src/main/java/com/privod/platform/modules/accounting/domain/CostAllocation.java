package com.privod.platform.modules.accounting.domain;

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
@Table(name = "cost_allocations", indexes = {
        @Index(name = "idx_cost_allocation_center", columnList = "cost_center_id"),
        @Index(name = "idx_cost_allocation_period", columnList = "period_id"),
        @Index(name = "idx_cost_allocation_account", columnList = "account_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CostAllocation extends BaseEntity {

    @Column(name = "cost_center_id", nullable = false)
    private UUID costCenterId;

    @Column(name = "period_id", nullable = false)
    private UUID periodId;

    @Column(name = "account_id", nullable = false)
    private UUID accountId;

    @Column(name = "amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "allocation_type", nullable = false, length = 30)
    private AllocationType allocationType;
}
