package com.privod.platform.modules.portal.domain;

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
import java.util.UUID;

@Entity
@Table(name = "client_claims", indexes = {
        @Index(name = "idx_cc_org", columnList = "organization_id"),
        @Index(name = "idx_cc_project", columnList = "project_id"),
        @Index(name = "idx_cc_status", columnList = "status"),
        @Index(name = "idx_cc_priority", columnList = "priority"),
        @Index(name = "idx_cc_category", columnList = "category"),
        @Index(name = "idx_cc_contractor", columnList = "assigned_contractor_id"),
        @Index(name = "idx_cc_portal_user", columnList = "reported_by_portal_user_id"),
        @Index(name = "idx_cc_number", columnList = "claim_number")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClientClaim extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "claim_number", length = 50)
    private String claimNumber;

    @Column(name = "unit_number", length = 100)
    private String unitNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 50)
    private ClaimCategory category;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false, length = 20)
    @Builder.Default
    private ClaimPriority priority = ClaimPriority.MEDIUM;

    @Column(name = "title", nullable = false, length = 500)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(name = "location_description", columnDefinition = "TEXT")
    private String locationDescription;

    @Column(name = "photos_json", columnDefinition = "TEXT")
    private String photosJson;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private ClaimStatus status = ClaimStatus.SUBMITTED;

    @Column(name = "assigned_contractor_id")
    private UUID assignedContractorId;

    @Column(name = "assigned_contractor_name", length = 255)
    private String assignedContractorName;

    @Column(name = "assigned_at")
    private Instant assignedAt;

    @Column(name = "reported_by_portal_user_id")
    private UUID reportedByPortalUserId;

    @Column(name = "reported_by_name", length = 255)
    private String reportedByName;

    @Column(name = "reported_by_phone", length = 50)
    private String reportedByPhone;

    @Column(name = "reported_by_email", length = 255)
    private String reportedByEmail;

    @Column(name = "sla_deadline")
    private Instant slaDeadline;

    @Column(name = "sla_breached")
    @Builder.Default
    private Boolean slaBreached = false;

    @Column(name = "resolution", columnDefinition = "TEXT")
    private String resolution;

    @Column(name = "resolution_date")
    private Instant resolutionDate;

    @Column(name = "resolution_accepted")
    private Boolean resolutionAccepted;

    @Column(name = "resolution_feedback", columnDefinition = "TEXT")
    private String resolutionFeedback;

    @Column(name = "resolution_rating")
    private Integer resolutionRating;

    @Column(name = "warranty_obligation_id")
    private UUID warrantyObligationId;

    @Column(name = "internal_notes", columnDefinition = "TEXT")
    private String internalNotes;

    @Column(name = "triaged_at")
    private Instant triagedAt;

    @Column(name = "triaged_by")
    private UUID triagedBy;
}
