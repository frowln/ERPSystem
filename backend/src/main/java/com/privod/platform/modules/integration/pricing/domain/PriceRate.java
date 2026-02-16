package com.privod.platform.modules.integration.pricing.domain;

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
@Table(name = "price_rates", indexes = {
        @Index(name = "idx_pr_database_id", columnList = "database_id"),
        @Index(name = "idx_pr_code", columnList = "code"),
        @Index(name = "idx_pr_category", columnList = "category"),
        @Index(name = "idx_pr_subcategory", columnList = "subcategory"),
        @Index(name = "idx_pr_name", columnList = "name")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PriceRate extends BaseEntity {

    @Column(name = "database_id", nullable = false)
    private UUID databaseId;

    @Column(name = "code", nullable = false, length = 100)
    private String code;

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Column(name = "unit", length = 100)
    private String unit;

    @Column(name = "labor_cost", precision = 15, scale = 2)
    private BigDecimal laborCost;

    @Column(name = "material_cost", precision = 15, scale = 2)
    private BigDecimal materialCost;

    @Column(name = "equipment_cost", precision = 15, scale = 2)
    private BigDecimal equipmentCost;

    @Column(name = "overhead_cost", precision = 15, scale = 2)
    private BigDecimal overheadCost;

    @Column(name = "total_cost", precision = 15, scale = 2)
    private BigDecimal totalCost;

    @Column(name = "category", length = 255)
    private String category;

    @Column(name = "subcategory", length = 255)
    private String subcategory;
}
