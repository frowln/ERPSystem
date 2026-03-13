package com.privod.platform.modules.warehouse.domain;

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
@Table(name = "materials", indexes = {
        @Index(name = "idx_material_org", columnList = "organization_id"),
        @Index(name = "idx_material_org_code", columnList = "organization_id, code", unique = true),
        @Index(name = "idx_material_category", columnList = "category"),
        @Index(name = "idx_material_active", columnList = "active")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Material extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Column(name = "code", length = 100)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", length = 30)
    private MaterialCategory category;

    @Column(name = "unit_of_measure", nullable = false, length = 50)
    private String unitOfMeasure;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "min_stock_level", precision = 16, scale = 3)
    @Builder.Default
    private BigDecimal minStockLevel = BigDecimal.ZERO;

    @Column(name = "current_price", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal currentPrice = BigDecimal.ZERO;

    @Column(name = "active", nullable = false)
    @Builder.Default
    private boolean active = true;
}
