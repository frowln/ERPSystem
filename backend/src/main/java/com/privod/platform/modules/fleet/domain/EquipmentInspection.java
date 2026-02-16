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

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "equipment_inspections", indexes = {
        @Index(name = "idx_inspection_vehicle", columnList = "vehicle_id"),
        @Index(name = "idx_inspection_inspector", columnList = "inspector_id"),
        @Index(name = "idx_equip_inspection_date", columnList = "inspection_date"),
        @Index(name = "idx_inspection_type", columnList = "inspection_type"),
        @Index(name = "idx_inspection_next_date", columnList = "next_inspection_date")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EquipmentInspection extends BaseEntity {

    @Column(name = "vehicle_id", nullable = false)
    private UUID vehicleId;

    @Column(name = "inspector_id")
    private UUID inspectorId;

    @Column(name = "inspection_date", nullable = false)
    private LocalDate inspectionDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "inspection_type", nullable = false, length = 20)
    private InspectionType inspectionType;

    @Enumerated(EnumType.STRING)
    @Column(name = "overall_rating", nullable = false, length = 20)
    private InspectionRating overallRating;

    @Column(name = "findings", columnDefinition = "TEXT")
    private String findings;

    @Column(name = "recommendations", columnDefinition = "TEXT")
    private String recommendations;

    @Column(name = "next_inspection_date")
    private LocalDate nextInspectionDate;
}
