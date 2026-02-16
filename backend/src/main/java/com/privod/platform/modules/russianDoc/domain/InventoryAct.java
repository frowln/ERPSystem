package com.privod.platform.modules.russianDoc.domain;

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
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Инвентаризационная ведомость.
 * Документ результатов инвентаризации ТМЦ на складе.
 */
@Entity
@Table(name = "inventory_act", indexes = {
        @Index(name = "idx_inventory_act_number", columnList = "number"),
        @Index(name = "idx_inventory_act_date", columnList = "date"),
        @Index(name = "idx_inventory_act_status", columnList = "status"),
        @Index(name = "idx_inventory_act_warehouse", columnList = "warehouse_id"),
        @Index(name = "idx_inventory_act_project", columnList = "project_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryAct extends BaseEntity {

    @Column(name = "number", nullable = false, length = 100)
    private String number;

    @Column(name = "date", nullable = false)
    private LocalDate date;

    @Column(name = "warehouse_id", nullable = false)
    private UUID warehouseId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "commission_members", nullable = false, columnDefinition = "jsonb")
    private String commissionMembers;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "items", nullable = false, columnDefinition = "jsonb")
    private String items;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private RussianDocStatus status = RussianDocStatus.DRAFT;

    @Column(name = "organization_id")
    private UUID organizationId;

    @Column(name = "project_id")
    private UUID projectId;

    public boolean canTransitionTo(RussianDocStatus newStatus) {
        return this.status.canTransitionTo(newStatus);
    }
}
