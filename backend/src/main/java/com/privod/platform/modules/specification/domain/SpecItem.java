package com.privod.platform.modules.specification.domain;

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
@Table(name = "spec_items", indexes = {
        @Index(name = "idx_spec_item_spec", columnList = "specification_id"),
        @Index(name = "idx_spec_item_type", columnList = "item_type"),
        @Index(name = "idx_spec_item_product_code", columnList = "product_code")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SpecItem extends BaseEntity {

    @Column(name = "specification_id", nullable = false)
    private UUID specificationId;

    @Column(name = "sequence", nullable = false)
    @Builder.Default
    private Integer sequence = 0;

    /** Position number from the PDF spec table, e.g. "1", "1.1", "А1" */
    @Column(name = "position", length = 20)
    private String position;

    /** Section grouping from the PDF, e.g. "СИСТЕМА ОТОПЛЕНИЯ (ОВ)" */
    @Column(name = "section_name", length = 500)
    private String sectionName;

    @Enumerated(EnumType.STRING)
    @Column(name = "item_type", nullable = false, length = 20)
    private SpecItemType itemType;

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Column(name = "brand", length = 255)
    private String brand;

    @Column(name = "product_code", length = 100)
    private String productCode;

    @Column(name = "manufacturer", length = 255)
    private String manufacturer;

    @Column(name = "quantity", nullable = false, precision = 16, scale = 3)
    private BigDecimal quantity;

    @Column(name = "unit_of_measure", nullable = false, length = 50)
    private String unitOfMeasure;

    @Column(name = "planned_amount", precision = 18, scale = 2)
    private BigDecimal plannedAmount;

    @Column(name = "weight", precision = 10, scale = 3)
    private BigDecimal weight;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "procurement_status", nullable = false, length = 50)
    @Builder.Default
    private String procurementStatus = "not_started";

    @Column(name = "estimate_status", nullable = false, length = 50)
    @Builder.Default
    private String estimateStatus = "not_started";

    @Column(name = "is_customer_provided", nullable = false)
    @Builder.Default
    private boolean isCustomerProvided = false;

    @Column(name = "budget_item_id")
    private UUID budgetItemId;
}
