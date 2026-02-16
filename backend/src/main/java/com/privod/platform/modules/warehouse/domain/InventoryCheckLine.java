package com.privod.platform.modules.warehouse.domain;

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
@Table(name = "inventory_check_lines", indexes = {
        @Index(name = "idx_icl_check", columnList = "check_id"),
        @Index(name = "idx_icl_material", columnList = "material_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryCheckLine extends BaseEntity {

    @Column(name = "check_id", nullable = false)
    private UUID checkId;

    @Column(name = "material_id", nullable = false)
    private UUID materialId;

    @Column(name = "material_name", length = 500)
    private String materialName;

    @Column(name = "expected_quantity", precision = 16, scale = 3)
    private BigDecimal expectedQuantity;

    @Column(name = "actual_quantity", precision = 16, scale = 3)
    private BigDecimal actualQuantity;

    @Column(name = "variance", precision = 16, scale = 3)
    private BigDecimal variance;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
