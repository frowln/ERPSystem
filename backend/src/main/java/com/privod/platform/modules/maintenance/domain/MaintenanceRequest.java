package com.privod.platform.modules.maintenance.domain;

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
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "maintenance_requests", indexes = {
        @Index(name = "idx_maint_req_status", columnList = "status"),
        @Index(name = "idx_maint_req_equipment", columnList = "equipment_id"),
        @Index(name = "idx_maint_req_team", columnList = "maintenance_team_id"),
        @Index(name = "idx_maint_req_responsible", columnList = "responsible_id"),
        @Index(name = "idx_maint_req_stage", columnList = "stage_id"),
        @Index(name = "idx_maint_req_priority", columnList = "priority"),
        @Index(name = "idx_maint_req_type", columnList = "maintenance_type"),
        @Index(name = "idx_maint_req_scheduled", columnList = "scheduled_date"),
        @Index(name = "idx_maint_req_request_date", columnList = "request_date")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceRequest extends BaseEntity {

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "request_date", nullable = false)
    private LocalDate requestDate;

    @Column(name = "equipment_id")
    private UUID equipmentId;

    @Column(name = "equipment_name", length = 300)
    private String equipmentName;

    @Column(name = "maintenance_team_id")
    private UUID maintenanceTeamId;

    @Column(name = "responsible_id")
    private UUID responsibleId;

    @Column(name = "stage_id")
    private UUID stageId;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false, length = 10)
    @Builder.Default
    private MaintenancePriority priority = MaintenancePriority.NORMAL;

    @Enumerated(EnumType.STRING)
    @Column(name = "maintenance_type", nullable = false, length = 20)
    @Builder.Default
    private MaintenanceType maintenanceType = MaintenanceType.CORRECTIVE;

    @Column(name = "duration", precision = 10, scale = 2)
    private BigDecimal duration;

    @Column(name = "scheduled_date")
    private LocalDate scheduledDate;

    @Column(name = "completed_date")
    private LocalDate completedDate;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "cost", precision = 18, scale = 2)
    private BigDecimal cost;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private RequestStatus status = RequestStatus.NEW;

    public boolean canTransitionTo(RequestStatus newStatus) {
        return this.status.canTransitionTo(newStatus);
    }
}
