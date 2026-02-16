package com.privod.platform.modules.procurementExt.domain;

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

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "delivery_items", indexes = {
        @Index(name = "idx_di_delivery", columnList = "delivery_id"),
        @Index(name = "idx_di_material", columnList = "material_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryItem extends BaseEntity {

    @Column(name = "delivery_id", nullable = false)
    private UUID deliveryId;

    @Column(name = "material_id", nullable = false)
    private UUID materialId;

    @Column(name = "quantity", nullable = false, precision = 16, scale = 3)
    private BigDecimal quantity;

    @Column(name = "unit", length = 50)
    private String unit;

    @Column(name = "weight", precision = 12, scale = 3)
    private BigDecimal weight;
}
