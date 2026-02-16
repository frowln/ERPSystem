package com.privod.platform.modules.accounting.domain;

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
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "ens_payments", indexes = {
        @Index(name = "idx_ens_payment_account", columnList = "ens_account_id"),
        @Index(name = "idx_ens_payment_date", columnList = "payment_date"),
        @Index(name = "idx_ens_payment_tax_type", columnList = "tax_type"),
        @Index(name = "idx_ens_payment_status", columnList = "status")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EnsPayment extends BaseEntity {

    @Column(name = "ens_account_id", nullable = false)
    private UUID ensAccountId;

    @Column(name = "amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;

    @Column(name = "payment_date", nullable = false)
    private LocalDate paymentDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "tax_type", nullable = false, length = 30)
    private EnsTaxType taxType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private EnsPaymentStatus status = EnsPaymentStatus.DRAFT;

    @Column(name = "receipt_url", length = 1000)
    private String receiptUrl;

    public boolean canTransitionTo(EnsPaymentStatus newStatus) {
        return this.status.canTransitionTo(newStatus);
    }
}
