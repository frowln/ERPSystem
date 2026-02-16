package com.privod.platform.modules.contract.domain;

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

@Entity
@Table(name = "contract_types", indexes = {
        @Index(name = "idx_contract_type_code", columnList = "code", unique = true),
        @Index(name = "idx_contract_type_active", columnList = "active")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContractType extends BaseEntity {

    @Column(name = "code", nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "sequence", nullable = false)
    @Builder.Default
    private Integer sequence = 0;

    @Column(name = "active", nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(name = "requires_lawyer_approval", nullable = false)
    @Builder.Default
    private boolean requiresLawyerApproval = true;

    @Column(name = "requires_management_approval", nullable = false)
    @Builder.Default
    private boolean requiresManagementApproval = true;

    @Column(name = "requires_finance_approval", nullable = false)
    @Builder.Default
    private boolean requiresFinanceApproval = true;
}
