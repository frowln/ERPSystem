package com.privod.platform.modules.analytics.domain;

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
import java.util.UUID;

@Entity
@Table(name = "risk_factor_weights", indexes = {
        @Index(name = "idx_risk_weight_org", columnList = "organization_id"),
        @Index(name = "idx_risk_weight_category", columnList = "factor_category")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RiskFactorWeight extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "factor_name", nullable = false, length = 200)
    private String factorName;

    @Enumerated(EnumType.STRING)
    @Column(name = "factor_category", nullable = false, length = 20)
    private RiskFactorCategory factorCategory;

    @Column(name = "weight_value", nullable = false, precision = 5, scale = 4)
    @Builder.Default
    private BigDecimal weightValue = BigDecimal.ONE;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
}
