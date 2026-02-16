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
@Table(name = "safety_inspections", indexes = {
        @Index(name = "idx_inspection_date", columnList = "inspection_date"),
        @Index(name = "idx_inspection_project", columnList = "project_id"),
        @Index(name = "idx_inspection_status", columnList = "status"),
        @Index(name = "idx_inspection_number", columnList = "number", unique = true)
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SafetyInspection extends BaseEntity {

    @Column(name = "number", unique = true, length = 20)
    private String number;

    @Column(name = "inspection_date", nullable = false)
    private LocalDate inspectionDate;

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "inspector_id")
    private UUID inspectorId;

    @Column(name = "inspector_name", length = 255)
    private String inspectorName;

    @Enumerated(EnumType.STRING)
    @Column(name = "inspection_type", nullable = false, length = 20)
    private InspectionType inspectionType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private InspectionStatus status = InspectionStatus.PLANNED;

    @Enumerated(EnumType.STRING)
    @Column(name = "overall_rating", length = 20)
    private InspectionRating overallRating;

    @Column(name = "findings", columnDefinition = "TEXT")
    private String findings;

    @Column(name = "recommendations", columnDefinition = "TEXT")
    private String recommendations;

    @Column(name = "next_inspection_date")
    private LocalDate nextInspectionDate;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
