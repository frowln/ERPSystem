package com.privod.platform.modules.subscription.domain;

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
import org.hibernate.annotations.Filter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "bank_invoices", indexes = {
        @Index(name = "idx_bank_invoices_org", columnList = "organization_id")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BankInvoice extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "plan_id")
    private UUID planId;

    @Column(name = "invoice_number", nullable = false, length = 50)
    private String invoiceNumber;

    @Column(name = "amount", precision = 12, scale = 2, nullable = false)
    private BigDecimal amount;

    @Column(name = "currency", length = 10)
    @Builder.Default
    private String currency = "RUB";

    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private String status = "PENDING";

    @Column(name = "buyer_name")
    private String buyerName;

    @Column(name = "buyer_inn", length = 12)
    private String buyerInn;

    @Column(name = "buyer_kpp", length = 9)
    private String buyerKpp;

    @Column(name = "buyer_address", columnDefinition = "TEXT")
    private String buyerAddress;

    @Column(name = "seller_name")
    private String sellerName;

    @Column(name = "seller_inn", length = 12)
    private String sellerInn;

    @Column(name = "seller_kpp", length = 9)
    private String sellerKpp;

    @Column(name = "seller_bank_account", length = 20)
    private String sellerBankAccount;

    @Column(name = "seller_bank_bik", length = 9)
    private String sellerBankBik;

    @Column(name = "seller_bank_name")
    private String sellerBankName;

    @Column(name = "paid_at")
    private Instant paidAt;
}
