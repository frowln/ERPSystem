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
@Table(name = "incident_corrective_actions", indexes = {
        @Index(name = "idx_ica_incident", columnList = "incident_id"),
        @Index(name = "idx_ica_org", columnList = "organization_id"),
        @Index(name = "idx_ica_status", columnList = "organization_id, status"),
        @Index(name = "idx_ica_due_date", columnList = "due_date")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IncidentCorrectiveAction extends BaseEntity {

    @Column(name = "incident_id", nullable = false)
    private UUID incidentId;

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Enumerated(EnumType.STRING)
    @Column(name = "action_type", nullable = false, length = 20)
    private CorrectiveActionType actionType;

    @Column(name = "description", columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(name = "responsible_id")
    private UUID responsibleId;

    @Column(name = "responsible_name", length = 255)
    private String responsibleName;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(name = "completed_date")
    private LocalDate completedDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private CorrectiveActionStatus status = CorrectiveActionStatus.PLANNED;

    @Column(name = "verification_date")
    private LocalDate verificationDate;

    @Column(name = "verified_by_id")
    private UUID verifiedById;

    @Column(name = "is_effective")
    private Boolean isEffective;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    public boolean isOverdue() {
        return status != CorrectiveActionStatus.COMPLETED
                && status != CorrectiveActionStatus.CANCELLED
                && dueDate.isBefore(LocalDate.now());
    }
}
