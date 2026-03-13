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
import java.time.LocalDate;
import java.util.UUID;

/**
 * Лимитно-заборная ведомость (ЛРВ / Limit Fence Sheet / Form M-8).
 * Устанавливает лимит выдачи материалов на объект/проект за период.
 * Связь: Project → Specification → LimitFenceSheet → StockMovement (ISSUE).
 */
@Entity
@Table(name = "limit_fence_sheets", indexes = {
        @Index(name = "idx_lfs_org", columnList = "organization_id"),
        @Index(name = "idx_lfs_org_project", columnList = "organization_id, project_id"),
        @Index(name = "idx_lfs_org_sheet", columnList = "organization_id, sheet_number", unique = true),
        @Index(name = "idx_lfs_project", columnList = "project_id"),
        @Index(name = "idx_lfs_material", columnList = "material_id"),
        @Index(name = "idx_lfs_status", columnList = "status"),
        @Index(name = "idx_lfs_period", columnList = "period_start, period_end")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LimitFenceSheet extends BaseEntity {

    @Column(name = "sheet_number", nullable = false, length = 50)
    private String sheetNumber;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "material_id", nullable = false)
    private UUID materialId;

    @Column(name = "material_name", length = 500)
    private String materialName;

    @Column(name = "unit", length = 20)
    private String unit;

    @Column(name = "limit_quantity", nullable = false, precision = 18, scale = 4)
    private BigDecimal limitQuantity;

    @Column(name = "issued_quantity", precision = 18, scale = 4)
    @Builder.Default
    private BigDecimal issuedQuantity = BigDecimal.ZERO;

    @Column(name = "returned_quantity", precision = 18, scale = 4)
    @Builder.Default
    private BigDecimal returnedQuantity = BigDecimal.ZERO;

    @Column(name = "period_start", nullable = false)
    private LocalDate periodStart;

    @Column(name = "period_end", nullable = false)
    private LocalDate periodEnd;

    @Column(name = "warehouse_id")
    private UUID warehouseId;

    @Column(name = "responsible_id")
    private UUID responsibleId;

    @Column(name = "specification_id")
    private UUID specificationId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private LimitFenceSheetStatus status = LimitFenceSheetStatus.ACTIVE;

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    public BigDecimal getRemainingQuantity() {
        return limitQuantity.subtract(issuedQuantity).add(returnedQuantity);
    }

    public boolean hasRemainingLimit() {
        return getRemainingQuantity().compareTo(BigDecimal.ZERO) > 0;
    }
}
