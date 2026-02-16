package com.privod.platform.modules.priceCoefficient.domain;

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
@Table(name = "price_coefficients", indexes = {
        @Index(name = "idx_price_coeff_contract", columnList = "contract_id"),
        @Index(name = "idx_price_coeff_project", columnList = "project_id"),
        @Index(name = "idx_price_coeff_type", columnList = "type"),
        @Index(name = "idx_price_coeff_status", columnList = "status"),
        @Index(name = "idx_price_coeff_code", columnList = "code", unique = true),
        @Index(name = "idx_price_coeff_effective", columnList = "effective_from,effective_to")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PriceCoefficient extends BaseEntity {

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Column(name = "code", unique = true, length = 50)
    private String code;

    @Column(name = "value", nullable = false, precision = 12, scale = 6)
    private BigDecimal value;

    @Column(name = "effective_from", nullable = false)
    private LocalDate effectiveFrom;

    @Column(name = "effective_to")
    private LocalDate effectiveTo;

    @Column(name = "contract_id")
    private UUID contractId;

    @Column(name = "project_id")
    private UUID projectId;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 20)
    private CoefficientType type;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private CoefficientStatus status = CoefficientStatus.DRAFT;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "applied_to_estimate_items", nullable = false)
    @Builder.Default
    private boolean appliedToEstimateItems = false;

    public boolean isEffectiveOn(LocalDate date) {
        if (date == null) {
            return false;
        }
        boolean afterStart = !date.isBefore(effectiveFrom);
        boolean beforeEnd = effectiveTo == null || !date.isAfter(effectiveTo);
        return afterStart && beforeEnd && status == CoefficientStatus.ACTIVE;
    }

    public BigDecimal applyTo(BigDecimal originalPrice) {
        if (originalPrice == null || value == null) {
            return originalPrice;
        }
        return originalPrice.multiply(value);
    }
}
