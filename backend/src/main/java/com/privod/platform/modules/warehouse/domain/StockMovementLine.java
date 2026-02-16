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
@Table(name = "stock_movement_lines", indexes = {
        @Index(name = "idx_sml_movement", columnList = "movement_id"),
        @Index(name = "idx_sml_material", columnList = "material_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockMovementLine extends BaseEntity {

    @Column(name = "movement_id", nullable = false)
    private UUID movementId;

    @Column(name = "material_id", nullable = false)
    private UUID materialId;

    @Column(name = "material_name", length = 500)
    private String materialName;

    @Column(name = "sequence")
    @Builder.Default
    private Integer sequence = 0;

    @Column(name = "quantity", nullable = false, precision = 16, scale = 3)
    private BigDecimal quantity;

    @Column(name = "unit_price", precision = 18, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "total_price", precision = 18, scale = 2)
    private BigDecimal totalPrice;

    @Column(name = "unit_of_measure", length = 50)
    private String unitOfMeasure;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    public void recalculateTotal() {
        if (this.quantity != null && this.unitPrice != null) {
            this.totalPrice = this.quantity.multiply(this.unitPrice);
        }
    }
}
