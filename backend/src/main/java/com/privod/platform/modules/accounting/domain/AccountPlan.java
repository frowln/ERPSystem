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
import org.hibernate.annotations.Filter;

import java.util.UUID;

@Entity
@Table(name = "account_plans", indexes = {
        @Index(name = "idx_account_plan_org", columnList = "organization_id"),
        @Index(name = "idx_account_plan_org_code", columnList = "organization_id, code", unique = true),
        @Index(name = "idx_account_plan_code", columnList = "code"),
        @Index(name = "idx_account_plan_parent", columnList = "parent_id"),
        @Index(name = "idx_account_plan_type", columnList = "account_type")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountPlan extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "code", nullable = false, length = 20)
    private String code;

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "account_type", nullable = false, length = 20)
    private AccountType accountType;

    @Column(name = "parent_id")
    private UUID parentId;

    @Column(name = "is_analytical", nullable = false)
    @Builder.Default
    private boolean analytical = false;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
}
