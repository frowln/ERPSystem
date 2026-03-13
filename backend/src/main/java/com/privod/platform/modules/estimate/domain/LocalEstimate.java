package com.privod.platform.modules.estimate.domain;

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
import org.hibernate.annotations.Filter;

import com.privod.platform.infrastructure.finance.VatCalculator;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "local_estimates", indexes = {
        @Index(name = "idx_le_org", columnList = "organization_id"),
        @Index(name = "idx_le_project", columnList = "project_id"),
        @Index(name = "idx_le_status", columnList = "status")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LocalEstimate extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "contract_id")
    private UUID contractId;

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Column(name = "number", length = 100)
    private String number;

    @Column(name = "object_name", length = 500)
    private String objectName;

    @Enumerated(EnumType.STRING)
    @Column(name = "calculation_method", nullable = false, length = 20)
    @Builder.Default
    private CalculationMethod calculationMethod = CalculationMethod.RIM;

    @Column(name = "region", length = 255)
    private String region;

    @Column(name = "base_year")
    private Integer baseYear;

    @Column(name = "price_level_quarter", length = 20)
    private String priceLevelQuarter;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private LocalEstimateStatus status = LocalEstimateStatus.DRAFT;

    @Column(name = "total_direct_cost", precision = 15, scale = 2)
    private BigDecimal totalDirectCost;

    @Column(name = "total_overhead", precision = 15, scale = 2)
    private BigDecimal totalOverhead;

    @Column(name = "total_estimated_profit", precision = 15, scale = 2)
    private BigDecimal totalEstimatedProfit;

    @Column(name = "total_with_vat", precision = 15, scale = 2)
    private BigDecimal totalWithVat;

    @Column(name = "vat_rate", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal vatRate = VatCalculator.DEFAULT_RATE;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "calculated_at")
    private Instant calculatedAt;

    /**
     * Индекс перевода из базисных цен 2001 года в текущий уровень цен.
     * Применяется при методе BASIS_INDEX. Значение по умолчанию 8.0 соответствует
     * усреднённому индексу Минстроя для СМР (РИМ, 2025 год).
     * МДС 81-35.2004: текущая цена = базисная цена 2001 × индекс.
     */
    @Column(name = "index_factor", precision = 8, scale = 4)
    @Builder.Default
    private BigDecimal indexFactor = new BigDecimal("8.0000");

    /**
     * НР (накладные расходы) — per МДС 81-33: 80% от ФОТ (фонда оплаты труда рабочих).
     * Default: 0.80.
     */
    @Column(name = "overhead_rate", precision = 8, scale = 4)
    @Builder.Default
    private BigDecimal overheadRate = new BigDecimal("0.8000");

    /**
     * СП (сметная прибыль) — per МДС 81-25: 50% от ОЗП (основной зарплаты рабочих).
     * Default: 0.50.
     */
    @Column(name = "profit_rate", precision = 8, scale = 4)
    @Builder.Default
    private BigDecimal profitRate = new BigDecimal("0.5000");
}
