package com.privod.platform.modules.fleet.domain;

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
@Table(name = "vehicle_assignments", indexes = {
        @Index(name = "idx_assignment_vehicle", columnList = "vehicle_id"),
        @Index(name = "idx_assignment_project", columnList = "project_id"),
        @Index(name = "idx_assignment_operator", columnList = "operator_id"),
        @Index(name = "idx_assignment_status", columnList = "status")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehicleAssignment extends BaseEntity {

    @Column(name = "vehicle_id", nullable = false)
    private UUID vehicleId;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "assigned_by_id")
    private UUID assignedById;

    @Column(name = "operator_id")
    private UUID operatorId;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "actual_return_date")
    private LocalDate actualReturnDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private AssignmentStatus status = AssignmentStatus.PLANNED;

    @Column(name = "daily_rate", precision = 12, scale = 2)
    private BigDecimal dailyRate;

    @Column(name = "total_cost", precision = 18, scale = 2)
    private BigDecimal totalCost;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
