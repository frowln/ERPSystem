package com.privod.platform.modules.contractExt.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import org.hibernate.annotations.Filter;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "contract_guarantees", indexes = {
        @Index(name = "idx_guarantee_contract", columnList = "contract_id"),
        @Index(name = "idx_guarantee_status", columnList = "status"),
        @Index(name = "idx_guarantee_expires", columnList = "expires_at")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContractGuarantee extends BaseEntity {

    @Column(name = "organization_id")
    private UUID organizationId;

    @Column(name = "contract_id", nullable = false)
    private UUID contractId;

    @Enumerated(EnumType.STRING)
    @Column(name = "guarantee_type", nullable = false, length = 30)
    private GuaranteeType guaranteeType;

    @Column(name = "amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;

    @Column(name = "currency", nullable = false, length = 10)
    @Builder.Default
    private String currency = "RUB";

    @Column(name = "issued_by", length = 500)
    private String issuedBy;

    @Column(name = "issued_at")
    private LocalDate issuedAt;

    @Column(name = "expires_at")
    private LocalDate expiresAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private GuaranteeStatus status = GuaranteeStatus.ACTIVE;

    @Column(name = "document_url", length = 1000)
    private String documentUrl;
}
