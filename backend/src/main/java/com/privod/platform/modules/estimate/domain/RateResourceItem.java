package com.privod.platform.modules.estimate.domain;

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
import java.util.UUID;

@Entity
@Table(name = "rate_resource_items", indexes = {
        @Index(name = "idx_rri_rate", columnList = "rate_id"),
        @Index(name = "idx_rri_type", columnList = "resource_type")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RateResourceItem extends BaseEntity {

    @Column(name = "rate_id", nullable = false)
    private UUID rateId;

    @Enumerated(EnumType.STRING)
    @Column(name = "resource_type", nullable = false, length = 20)
    private ResourceType resourceType;

    @Column(name = "resource_code", length = 100)
    private String resourceCode;

    @Column(name = "resource_name", nullable = false, length = 500)
    private String resourceName;

    @Column(name = "unit", length = 50)
    private String unit;

    @Column(name = "quantity_per_unit", nullable = false, precision = 15, scale = 6)
    @Builder.Default
    private BigDecimal quantityPerUnit = BigDecimal.ZERO;

    @Column(name = "base_price", precision = 15, scale = 2)
    private BigDecimal basePrice;
}
