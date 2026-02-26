package com.privod.platform.modules.subscription.domain;

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
import java.util.UUID;

@Entity
@Table(name = "billing_records", indexes = {
        @Index(name = "idx_br_organization_id", columnList = "organization_id"),
        @Index(name = "idx_br_subscription_id", columnList = "subscription_id"),
        @Index(name = "idx_br_invoice_date", columnList = "invoice_date")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BillingRecord extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "subscription_id", nullable = false)
    private UUID subscriptionId;

    @Column(name = "plan_name", nullable = false, length = 30)
    private String planName;

    @Column(name = "plan_display_name", nullable = false, length = 100)
    private String planDisplayName;

    @Column(name = "amount", precision = 12, scale = 2, nullable = false)
    private BigDecimal amount;

    @Column(name = "currency", length = 3, nullable = false)
    @Builder.Default
    private String currency = "RUB";

    @Enumerated(EnumType.STRING)
    @Column(name = "billing_type", length = 20, nullable = false)
    private BillingType billingType;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", length = 20, nullable = false)
    @Builder.Default
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;

    @Column(name = "invoice_date", nullable = false)
    private Instant invoiceDate;

    @Column(name = "paid_date")
    private Instant paidDate;

    @Column(name = "period_start")
    private Instant periodStart;

    @Column(name = "period_end")
    private Instant periodEnd;

    @Column(name = "invoice_number", length = 50)
    private String invoiceNumber;

    @Column(name = "description")
    private String description;
}
