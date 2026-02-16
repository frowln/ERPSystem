package com.privod.platform.modules.closing.domain;

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
@Table(name = "ks2_lines", indexes = {
        @Index(name = "idx_ks2_line_ks2", columnList = "ks2_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Ks2Line extends BaseEntity {

    @Column(name = "ks2_id", nullable = false)
    private UUID ks2Id;

    @Column(name = "sequence")
    @Builder.Default
    private Integer sequence = 0;

    @Column(name = "spec_item_id")
    private UUID specItemId;

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Column(name = "quantity", nullable = false, precision = 16, scale = 3)
    private BigDecimal quantity;

    @Column(name = "unit_price", nullable = false, precision = 18, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "amount", precision = 18, scale = 2)
    private BigDecimal amount;

    @Column(name = "unit_of_measure", length = 50)
    private String unitOfMeasure;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    public void computeAmount() {
        if (this.quantity != null && this.unitPrice != null) {
            this.amount = this.quantity.multiply(this.unitPrice);
        }
    }
}
