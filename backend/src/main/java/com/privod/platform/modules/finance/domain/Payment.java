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
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "payments", indexes = {
        @Index(name = "idx_payment_project", columnList = "project_id"),
        @Index(name = "idx_payment_contract", columnList = "contract_id"),
        @Index(name = "idx_payment_date", columnList = "payment_date"),
        @Index(name = "idx_payment_type", columnList = "payment_type"),
        @Index(name = "idx_payment_status", columnList = "status"),
        @Index(name = "idx_payment_number", columnList = "number", unique = true)
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Payment extends BaseEntity {

    @Column(name = "number", unique = true, length = 50)
    private String number;

    @Column(name = "payment_date", nullable = false)
    private LocalDate paymentDate;

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "contract_id")
    private UUID contractId;

    @Column(name = "partner_id")
    private UUID partnerId;

    @Column(name = "partner_name", length = 500)
    private String partnerName;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_type", nullable = false, length = 20)
    private PaymentType paymentType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private PaymentStatus status = PaymentStatus.DRAFT;

    @Column(name = "amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;

    @Column(name = "vat_amount", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal vatAmount = BigDecimal.ZERO;

    @Column(name = "total_amount", precision = 18, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "purpose", length = 1000)
    private String purpose;

    @Column(name = "bank_account", length = 100)
    private String bankAccount;

    @Column(name = "invoice_id")
    private UUID invoiceId;

    @Column(name = "approved_by_id")
    private UUID approvedById;

    @Column(name = "approved_at")
    private Instant approvedAt;

    @Column(name = "paid_at")
    private Instant paidAt;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    public boolean canTransitionTo(PaymentStatus newStatus) {
        return this.status.canTransitionTo(newStatus);
    }

    public BigDecimal calculateTotalAmount() {
        BigDecimal amt = amount != null ? amount : BigDecimal.ZERO;
        BigDecimal vat = vatAmount != null ? vatAmount : BigDecimal.ZERO;
        return amt.add(vat);
    }
}
