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

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "safety_incidents", indexes = {
        @Index(name = "idx_incident_date", columnList = "incident_date"),
        @Index(name = "idx_incident_project", columnList = "project_id"),
        @Index(name = "idx_incident_status", columnList = "status"),
        @Index(name = "idx_incident_severity", columnList = "severity"),
        @Index(name = "idx_incident_number", columnList = "number", unique = true)
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SafetyIncident extends BaseEntity {

    @Column(name = "number", unique = true, length = 20)
    private String number;

    @Column(name = "incident_date", nullable = false)
    private LocalDateTime incidentDate;

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "location_description", length = 500)
    private String locationDescription;

    @Enumerated(EnumType.STRING)
    @Column(name = "severity", nullable = false, length = 20)
    private IncidentSeverity severity;

    @Enumerated(EnumType.STRING)
    @Column(name = "incident_type", nullable = false, length = 30)
    private IncidentType incidentType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private IncidentStatus status = IncidentStatus.REPORTED;

    @Column(name = "description", columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(name = "root_cause", columnDefinition = "TEXT")
    private String rootCause;

    @Column(name = "corrective_action", columnDefinition = "TEXT")
    private String correctiveAction;

    @Column(name = "reported_by_id")
    private UUID reportedById;

    @Column(name = "reported_by_name", length = 255)
    private String reportedByName;

    @Column(name = "investigator_id")
    private UUID investigatorId;

    @Column(name = "investigator_name", length = 255)
    private String investigatorName;

    @Column(name = "injured_employee_id")
    private UUID injuredEmployeeId;

    @Column(name = "injured_employee_name", length = 255)
    private String injuredEmployeeName;

    @Column(name = "witness_names", columnDefinition = "TEXT")
    private String witnessNames;

    @Column(name = "work_days_lost")
    @Builder.Default
    private Integer workDaysLost = 0;

    @Column(name = "medical_treatment")
    @Builder.Default
    private boolean medicalTreatment = false;

    @Column(name = "hospitalization")
    @Builder.Default
    private boolean hospitalization = false;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    public boolean canTransitionTo(IncidentStatus newStatus) {
        return this.status.canTransitionTo(newStatus);
    }
}
