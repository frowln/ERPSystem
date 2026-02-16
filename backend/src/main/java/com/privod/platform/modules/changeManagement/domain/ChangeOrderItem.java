package com.privod.platform.modules.changeManagement.domain;

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
@Table(name = "change_order_items", indexes = {
        @Index(name = "idx_coi_change_order", columnList = "change_order_id"),
        @Index(name = "idx_coi_cost_code", columnList = "cost_code_id"),
        @Index(name = "idx_coi_wbs_node", columnList = "wbs_node_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChangeOrderItem extends BaseEntity {

    @Column(name = "change_order_id", nullable = false)
    private UUID changeOrderId;

    @Column(name = "description", nullable = false, length = 1000)
    private String description;

    @Column(name = "quantity", precision = 18, scale = 4)
    private BigDecimal quantity;

    @Column(name = "unit", length = 50)
    private String unit;

    @Column(name = "unit_price", precision = 18, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "total_price", precision = 18, scale = 2)
    private BigDecimal totalPrice;

    @Column(name = "cost_code_id")
    private UUID costCodeId;

    @Column(name = "wbs_node_id")
    private UUID wbsNodeId;

    @Column(name = "sort_order")
    private Integer sortOrder;
}
