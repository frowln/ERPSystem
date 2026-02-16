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

import java.time.LocalDate;

@Entity
@Table(name = "self_employed_contractors", indexes = {
        @Index(name = "idx_se_contractor_inn", columnList = "inn", unique = true),
        @Index(name = "idx_se_contractor_status", columnList = "status"),
        @Index(name = "idx_se_contractor_tax_status", columnList = "tax_status"),
        @Index(name = "idx_se_contractor_name", columnList = "full_name")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SelfEmployedContractor extends BaseEntity {

    @Column(name = "full_name", nullable = false, length = 500)
    private String fullName;

    @Column(name = "inn", nullable = false, unique = true, length = 12)
    private String inn;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "email", length = 255)
    private String email;

    @Column(name = "bank_account", length = 20)
    private String bankAccount;

    @Column(name = "bic", length = 9)
    private String bic;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private ContractorStatus status = ContractorStatus.ACTIVE;

    @Column(name = "registration_date", nullable = false)
    private LocalDate registrationDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "tax_status", nullable = false, length = 20)
    @Builder.Default
    private TaxStatus taxStatus = TaxStatus.ACTIVE;

    @Column(name = "project_ids", columnDefinition = "TEXT")
    private String projectIds;
}
