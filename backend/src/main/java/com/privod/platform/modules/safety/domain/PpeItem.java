package com.privod.platform.modules.safety.domain;

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
import java.util.UUID;

@Entity
@Table(name = "safety_ppe_items", indexes = {
        @Index(name = "idx_ppe_item_org", columnList = "organization_id"),
        @Index(name = "idx_ppe_item_category", columnList = "category"),
        @Index(name = "idx_ppe_item_sku", columnList = "sku")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PpeItem extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Column(name = "sku", length = 100)
    private String sku;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 30)
    private PpeItemCategory category;

    @Column(name = "size", length = 50)
    private String size;

    @Column(name = "certification_standard", length = 200)
    private String certificationStandard;

    @Column(name = "total_quantity", nullable = false)
    @Builder.Default
    private Integer totalQuantity = 0;

    @Column(name = "available_quantity", nullable = false)
    @Builder.Default
    private Integer availableQuantity = 0;

    @Column(name = "min_stock_level")
    @Builder.Default
    private Integer minStockLevel = 0;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
