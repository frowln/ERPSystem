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
import org.hibernate.annotations.Filter;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "safety_violations", indexes = {
        @Index(name = "idx_violation_org", columnList = "organization_id"),
        @Index(name = "idx_violation_org_inspection", columnList = "organization_id, inspection_id"),
        @Index(name = "idx_violation_org_incident", columnList = "organization_id, incident_id"),
        @Index(name = "idx_violation_inspection", columnList = "inspection_id"),
        @Index(name = "idx_violation_incident", columnList = "incident_id"),
        @Index(name = "idx_safety_violation_status", columnList = "status"),
        @Index(name = "idx_safety_violation_due_date", columnList = "due_date")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SafetyViolation extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "inspection_id")
    private UUID inspectionId;

    @Column(name = "incident_id")
    private UUID incidentId;

    @Column(name = "description", columnDefinition = "TEXT", nullable = false)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "severity", nullable = false, length = 20)
    private ViolationSeverity severity;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private ViolationStatus status = ViolationStatus.OPEN;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "assigned_to_id")
    private UUID assignedToId;

    @Column(name = "assigned_to_name", length = 255)
    private String assignedToName;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    @Column(name = "resolution", columnDefinition = "TEXT")
    private String resolution;
}
