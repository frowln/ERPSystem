package com.privod.platform.modules.estimate.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "local_estimate_lines", indexes = {
        @Index(name = "idx_lel_estimate", columnList = "estimate_id"),
        @Index(name = "idx_lel_rate", columnList = "rate_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LocalEstimateLine extends BaseEntity {

    @Column(name = "estimate_id", nullable = false)
    private UUID estimateId;

    @Column(name = "line_number", nullable = false)
    private int lineNumber;

    @Column(name = "rate_id")
    private UUID rateId;

    @Column(name = "justification", length = 100)
    private String justification;

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Column(name = "unit", length = 50)
    private String unit;

    @Column(name = "quantity", nullable = false, precision = 15, scale = 4)
    @Builder.Default
    private BigDecimal quantity = BigDecimal.ZERO;

    // Base prices (from normative database)
    @Column(name = "base_labor_cost", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal baseLaborCost = BigDecimal.ZERO;

    @Column(name = "base_material_cost", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal baseMaterialCost = BigDecimal.ZERO;

    @Column(name = "base_equipment_cost", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal baseEquipmentCost = BigDecimal.ZERO;

    @Column(name = "base_overhead_cost", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal baseOverheadCost = BigDecimal.ZERO;

    @Column(name = "base_total", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal baseTotal = BigDecimal.ZERO;

    // Current prices (after applying indices)
    @Column(name = "current_labor_cost", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal currentLaborCost = BigDecimal.ZERO;

    @Column(name = "current_material_cost", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal currentMaterialCost = BigDecimal.ZERO;

    @Column(name = "current_equipment_cost", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal currentEquipmentCost = BigDecimal.ZERO;

    @Column(name = "current_overhead_cost", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal currentOverheadCost = BigDecimal.ZERO;

    @Column(name = "current_total", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal currentTotal = BigDecimal.ZERO;

    // Index values applied
    @Column(name = "labor_index", precision = 10, scale = 4)
    @Builder.Default
    private BigDecimal laborIndex = BigDecimal.ONE;

    @Column(name = "material_index", precision = 10, scale = 4)
    @Builder.Default
    private BigDecimal materialIndex = BigDecimal.ONE;

    @Column(name = "equipment_index", precision = 10, scale = 4)
    @Builder.Default
    private BigDecimal equipmentIndex = BigDecimal.ONE;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    // Normative fields (Phase 5)
    @Column(name = "normative_code", length = 50)
    private String normativeCode;

    @Column(name = "norm_hours", precision = 12, scale = 4)
    private BigDecimal normHours;

    @Column(name = "base_price_2001", precision = 18, scale = 2)
    private BigDecimal basePrice2001;

    @Column(name = "price_index", precision = 10, scale = 4)
    private BigDecimal priceIndex;

    @Column(name = "current_price", precision = 18, scale = 2)
    private BigDecimal currentPrice;

    @Column(name = "direct_costs", precision = 18, scale = 2)
    private BigDecimal directCosts;

    @Column(name = "overhead_costs", precision = 18, scale = 2)
    private BigDecimal overheadCosts;

    @Column(name = "estimated_profit", precision = 18, scale = 2)
    private BigDecimal estimatedProfit;

    @Column(name = "budget_item_id")
    private UUID budgetItemId;
}
