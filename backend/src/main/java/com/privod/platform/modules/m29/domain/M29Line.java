package com.privod.platform.modules.m29.domain;

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
@Table(name = "m29_lines", indexes = {
        @Index(name = "idx_m29_line_m29", columnList = "m29_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class M29Line extends BaseEntity {

    @Column(name = "m29_id", nullable = false)
    private UUID m29Id;

    @Column(name = "spec_item_id")
    private UUID specItemId;

    @Column(name = "sequence")
    @Builder.Default
    private Integer sequence = 0;

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Column(name = "planned_quantity", precision = 16, scale = 3)
    private BigDecimal plannedQuantity;

    @Column(name = "actual_quantity", precision = 16, scale = 3)
    private BigDecimal actualQuantity;

    @Column(name = "unit_of_measure", length = 50)
    private String unitOfMeasure;

    @Column(name = "variance", precision = 16, scale = 3)
    private BigDecimal variance;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    public void computeVariance() {
        if (this.actualQuantity != null && this.plannedQuantity != null) {
            this.variance = this.actualQuantity.subtract(this.plannedQuantity);
        }
    }
}
