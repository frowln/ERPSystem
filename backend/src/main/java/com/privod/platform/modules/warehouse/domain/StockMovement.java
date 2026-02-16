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

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "stock_movements", indexes = {
        @Index(name = "idx_sm_org", columnList = "organization_id"),
        @Index(name = "idx_sm_org_status", columnList = "organization_id, status"),
        @Index(name = "idx_sm_org_number", columnList = "organization_id, number", unique = true),
        @Index(name = "idx_sm_org_project", columnList = "organization_id, project_id"),
        @Index(name = "idx_sm_number", columnList = "number"),
        @Index(name = "idx_sm_date", columnList = "movement_date"),
        @Index(name = "idx_sm_type", columnList = "movement_type"),
        @Index(name = "idx_sm_status", columnList = "status"),
        @Index(name = "idx_sm_project", columnList = "project_id"),
        @Index(name = "idx_sm_source_location", columnList = "source_location_id"),
        @Index(name = "idx_sm_dest_location", columnList = "destination_location_id"),
        @Index(name = "idx_sm_purchase_request", columnList = "purchase_request_id"),
        @Index(name = "idx_sm_m29", columnList = "m29_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockMovement extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "number", length = 50)
    private String number;

    @Column(name = "movement_date", nullable = false)
    private LocalDate movementDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "movement_type", nullable = false, length = 30)
    private StockMovementType movementType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private StockMovementStatus status = StockMovementStatus.DRAFT;

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "source_location_id")
    private UUID sourceLocationId;

    @Column(name = "destination_location_id")
    private UUID destinationLocationId;

    @Column(name = "purchase_request_id")
    private UUID purchaseRequestId;

    @Column(name = "m29_id")
    private UUID m29Id;

    @Column(name = "responsible_id")
    private UUID responsibleId;

    @Column(name = "responsible_name", length = 500)
    private String responsibleName;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    public boolean canTransitionTo(StockMovementStatus newStatus) {
        return this.status.canTransitionTo(newStatus);
    }
}
