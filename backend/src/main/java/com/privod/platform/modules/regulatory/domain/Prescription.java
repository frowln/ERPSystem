package com.privod.platform.modules.regulatory.domain;

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
@Table(name = "prescriptions", indexes = {
        @Index(name = "idx_prescription_inspection", columnList = "inspection_id"),
        @Index(name = "idx_prescription_status", columnList = "status"),
        @Index(name = "idx_prescription_deadline", columnList = "deadline")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Prescription extends BaseEntity {

    @Column(name = "organization_id")
    private UUID organizationId;

    @Column(name = "inspection_id")
    private UUID inspectionId;

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "number", length = 50)
    private String number;

    @Column(name = "description", columnDefinition = "TEXT", nullable = false)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "regulatory_body_type", length = 30)
    private RegulatoryBodyType regulatoryBodyType;

    @Column(name = "received_date")
    private LocalDate receivedDate;

    @Column(name = "deadline")
    private LocalDate deadline;

    @Column(name = "appeal_deadline")
    private LocalDate appealDeadline;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private PrescriptionStatus status = PrescriptionStatus.OPEN;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "response_submitted_at")
    private Instant responseSubmittedAt;

    @Column(name = "response_date")
    private LocalDate responseDate;

    @Column(name = "evidence_url", length = 1000)
    private String evidenceUrl;

    @Column(name = "response_letter_url", length = 1000)
    private String responseLetterUrl;

    @Column(name = "responsible_id")
    private UUID responsibleId;

    @Column(name = "responsible_name", length = 255)
    private String responsibleName;

    @Column(name = "fine_amount", precision = 18, scale = 2)
    private java.math.BigDecimal fineAmount;

    @Column(name = "corrective_action_cost", precision = 18, scale = 2)
    private java.math.BigDecimal correctiveActionCost;

    @Column(name = "violation_count")
    @Builder.Default
    private Integer violationCount = 1;

    @Column(name = "regulatory_reference", length = 500)
    private String regulatoryReference;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "appeal_filed")
    @Builder.Default
    private boolean appealFiled = false;

    @Column(name = "appeal_date")
    private LocalDate appealDate;

    public boolean isAppealWindowOpen() {
        if (appealDeadline == null) return false;
        return !LocalDate.now().isAfter(appealDeadline);
    }
}
