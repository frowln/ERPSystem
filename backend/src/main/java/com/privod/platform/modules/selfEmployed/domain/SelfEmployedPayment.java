package com.privod.platform.modules.selfEmployed.domain;

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
@Table(name = "self_employed_payments", indexes = {
        @Index(name = "idx_se_payment_contractor", columnList = "contractor_id"),
        @Index(name = "idx_se_payment_project", columnList = "project_id"),
        @Index(name = "idx_se_payment_contract", columnList = "contract_id"),
        @Index(name = "idx_se_payment_status", columnList = "status"),
        @Index(name = "idx_se_payment_service_date", columnList = "service_date"),
        @Index(name = "idx_se_payment_tax_period", columnList = "tax_period")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SelfEmployedPayment extends BaseEntity {

    @Column(name = "contractor_id", nullable = false)
    private UUID contractorId;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "contract_id")
    private UUID contractId;

    @Column(name = "amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;

    @Column(name = "description", length = 1000)
    private String description;

    @Column(name = "service_date", nullable = false)
    private LocalDate serviceDate;

    @Column(name = "payment_date")
    private LocalDate paymentDate;

    @Column(name = "receipt_number", length = 100)
    private String receiptNumber;

    @Column(name = "receipt_url", length = 1000)
    private String receiptUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private SelfEmployedPaymentStatus status = SelfEmployedPaymentStatus.DRAFT;

    @Column(name = "fiscal_receipt_checked", nullable = false)
    @Builder.Default
    private boolean fiscalReceiptChecked = false;

    @Column(name = "tax_period", length = 10)
    private String taxPeriod;

    public boolean canTransitionTo(SelfEmployedPaymentStatus newStatus) {
        return this.status.canTransitionTo(newStatus);
    }
}
