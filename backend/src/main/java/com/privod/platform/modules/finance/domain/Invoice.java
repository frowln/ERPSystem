package com.privod.platform.modules.finance.domain;

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
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "invoices", indexes = {
        @Index(name = "idx_invoice_project", columnList = "project_id"),
        @Index(name = "idx_invoice_contract", columnList = "contract_id"),
        @Index(name = "idx_invoice_date", columnList = "invoice_date"),
        @Index(name = "idx_invoice_type", columnList = "invoice_type"),
        @Index(name = "idx_invoice_status", columnList = "status"),
        @Index(name = "idx_invoice_number", columnList = "number", unique = true)
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Invoice extends BaseEntity {

    @Column(name = "number", unique = true, length = 50)
    private String number;

    @Column(name = "invoice_date", nullable = false)
    private LocalDate invoiceDate;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "contract_id")
    private UUID contractId;

    @Column(name = "partner_id")
    private UUID partnerId;

    @Column(name = "partner_name", length = 500)
    private String partnerName;

    @Enumerated(EnumType.STRING)
    @Column(name = "invoice_type", nullable = false, length = 20)
    private InvoiceType invoiceType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private InvoiceStatus status = InvoiceStatus.DRAFT;

    @Column(name = "subtotal", precision = 18, scale = 2)
    private BigDecimal subtotal;

    @Column(name = "vat_rate", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal vatRate = new BigDecimal("20.00");

    @Column(name = "vat_amount", precision = 18, scale = 2)
    private BigDecimal vatAmount;

    @Column(name = "total_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "paid_amount", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal paidAmount = BigDecimal.ZERO;

    @Column(name = "remaining_amount", precision = 18, scale = 2)
    private BigDecimal remainingAmount;

    @Column(name = "ks2_id")
    private UUID ks2Id;

    @Column(name = "ks3_id")
    private UUID ks3Id;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    public boolean isOverdue() {
        if (dueDate == null) {
            return false;
        }
        return LocalDate.now().isAfter(dueDate)
                && status != InvoiceStatus.PAID
                && status != InvoiceStatus.CANCELLED;
    }

    public BigDecimal getPaymentPercent() {
        BigDecimal total = totalAmount != null ? totalAmount : BigDecimal.ZERO;
        if (total.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        BigDecimal paid = paidAmount != null ? paidAmount : BigDecimal.ZERO;
        return paid.multiply(new BigDecimal("100"))
                .divide(total, 2, RoundingMode.HALF_UP);
    }

    public BigDecimal calculateRemainingAmount() {
        BigDecimal total = totalAmount != null ? totalAmount : BigDecimal.ZERO;
        BigDecimal paid = paidAmount != null ? paidAmount : BigDecimal.ZERO;
        return total.subtract(paid);
    }
}
