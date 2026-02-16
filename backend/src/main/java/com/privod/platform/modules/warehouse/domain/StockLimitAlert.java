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

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "stock_limit_alerts", indexes = {
        @Index(name = "idx_sla_stock_limit", columnList = "stock_limit_id"),
        @Index(name = "idx_sla_material", columnList = "material_id"),
        @Index(name = "idx_sla_limit_type", columnList = "limit_type"),
        @Index(name = "idx_sla_severity", columnList = "severity"),
        @Index(name = "idx_sla_resolved", columnList = "is_resolved")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockLimitAlert extends BaseEntity {

    @Column(name = "stock_limit_id", nullable = false)
    private UUID stockLimitId;

    @Column(name = "material_id", nullable = false)
    private UUID materialId;

    @Column(name = "material_name", length = 500)
    private String materialName;

    @Column(name = "current_quantity", precision = 16, scale = 3)
    private BigDecimal currentQuantity;

    @Enumerated(EnumType.STRING)
    @Column(name = "limit_type", nullable = false, length = 30)
    private StockLimitType limitType;

    @Enumerated(EnumType.STRING)
    @Column(name = "severity", nullable = false, length = 30)
    private StockAlertSeverity severity;

    @Column(name = "acknowledged_by_id")
    private UUID acknowledgedById;

    @Column(name = "acknowledged_at")
    private LocalDateTime acknowledgedAt;

    @Column(name = "is_resolved", nullable = false)
    @Builder.Default
    private boolean isResolved = false;
}
