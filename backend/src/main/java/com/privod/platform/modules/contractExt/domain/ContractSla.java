package com.privod.platform.modules.contractExt.domain;

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
@Table(name = "contract_slas", indexes = {
        @Index(name = "idx_sla_contract", columnList = "contract_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContractSla extends BaseEntity {

    @Column(name = "contract_id", nullable = false)
    private UUID contractId;

    @Column(name = "metric", nullable = false, length = 200)
    private String metric;

    @Column(name = "target_value", nullable = false, precision = 18, scale = 4)
    private BigDecimal targetValue;

    @Column(name = "unit", nullable = false, length = 50)
    private String unit;

    @Column(name = "measurement_period", length = 50)
    private String measurementPeriod;

    @Column(name = "penalty_amount", precision = 18, scale = 2)
    private BigDecimal penaltyAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "penalty_type", length = 20)
    private PenaltyType penaltyType;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;
}
