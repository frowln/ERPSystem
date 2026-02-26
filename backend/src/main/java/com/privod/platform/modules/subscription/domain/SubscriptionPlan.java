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

@Entity
@Table(name = "subscription_plans", indexes = {
        @Index(name = "idx_sp_name", columnList = "name"),
        @Index(name = "idx_sp_is_active", columnList = "is_active")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubscriptionPlan extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(name = "name", nullable = false, length = 30, unique = true)
    private PlanName name;

    @Column(name = "display_name", nullable = false, length = 100)
    private String displayName;

    @Column(name = "price", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal price = BigDecimal.ZERO;

    @Column(name = "currency", length = 3)
    @Builder.Default
    private String currency = "RUB";

    @Enumerated(EnumType.STRING)
    @Column(name = "billing_period", length = 20)
    @Builder.Default
    private BillingPeriod billingPeriod = BillingPeriod.MONTHLY;

    @Column(name = "max_users")
    @Builder.Default
    private Integer maxUsers = 3;

    @Column(name = "max_projects")
    @Builder.Default
    private Integer maxProjects = 1;

    @Column(name = "max_storage_gb")
    @Builder.Default
    private Integer maxStorageGb = 1;

    @Column(name = "features", columnDefinition = "TEXT")
    private String features;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;
}
