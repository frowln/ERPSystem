package com.privod.platform.modules.contractExt.domain;

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
@Table(name = "contract_insurances", indexes = {
        @Index(name = "idx_insurance_contract", columnList = "contract_id"),
        @Index(name = "idx_insurance_status", columnList = "status"),
        @Index(name = "idx_insurance_end_date", columnList = "end_date")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContractInsurance extends BaseEntity {

    @Column(name = "contract_id", nullable = false)
    private UUID contractId;

    @Column(name = "policy_number", nullable = false, length = 100)
    private String policyNumber;

    @Column(name = "insurance_type", nullable = false, length = 100)
    private String insuranceType;

    @Column(name = "insurer", nullable = false, length = 500)
    private String insurer;

    @Column(name = "covered_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal coveredAmount;

    @Column(name = "premium_amount", precision = 18, scale = 2)
    private BigDecimal premiumAmount;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private InsuranceStatus status = InsuranceStatus.ACTIVE;

    @Column(name = "policy_url", length = 1000)
    private String policyUrl;
}
