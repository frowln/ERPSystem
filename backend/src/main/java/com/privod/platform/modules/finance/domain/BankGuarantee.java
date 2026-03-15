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
import org.hibernate.annotations.Filter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "bank_guarantees", indexes = {
        @Index(name = "idx_bank_guarantees_contract", columnList = "contract_id"),
        @Index(name = "idx_bank_guarantees_expiry", columnList = "expiry_date"),
        @Index(name = "idx_bank_guarantees_org", columnList = "organization_id")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BankGuarantee extends BaseEntity {

    @Column(name = "contract_id")
    private UUID contractId;

    @Column(name = "counterparty_id")
    private UUID counterpartyId;

    @Column(name = "bank_name", nullable = false, length = 500)
    private String bankName;

    @Column(name = "guarantee_number", length = 100)
    private String guaranteeNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "guarantee_type", nullable = false, length = 50)
    private GuaranteeType guaranteeType;

    @Column(name = "amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;

    @Column(name = "currency", length = 3)
    @Builder.Default
    private String currency = "RUB";

    @Column(name = "issue_date")
    private LocalDate issueDate;

    @Column(name = "expiry_date", nullable = false)
    private LocalDate expiryDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30)
    @Builder.Default
    private GuaranteeStatus status = GuaranteeStatus.ACTIVE;

    @Column(name = "document_url", length = 1000)
    private String documentUrl;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "organization_id")
    private UUID organizationId;
}
