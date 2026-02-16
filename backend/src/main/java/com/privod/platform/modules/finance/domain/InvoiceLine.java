package com.privod.platform.modules.finance.domain;

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
import java.math.RoundingMode;
import java.util.UUID;

@Entity
@Table(name = "invoice_lines", indexes = {
        @Index(name = "idx_invoice_line_invoice", columnList = "invoice_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceLine extends BaseEntity {

    @Column(name = "invoice_id", nullable = false)
    private UUID invoiceId;

    @Column(name = "sequence")
    @Builder.Default
    private Integer sequence = 0;

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

    public BigDecimal calculateAmount() {
        BigDecimal qty = quantity != null ? quantity : BigDecimal.ZERO;
        BigDecimal price = unitPrice != null ? unitPrice : BigDecimal.ZERO;
        return qty.multiply(price).setScale(2, RoundingMode.HALF_UP);
    }
}
