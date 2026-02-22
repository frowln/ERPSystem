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

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "portal_ks2_drafts", indexes = {
        @Index(name = "idx_pks2d_portal_user", columnList = "portal_user_id"),
        @Index(name = "idx_pks2d_project", columnList = "project_id"),
        @Index(name = "idx_pks2d_contract", columnList = "contract_id"),
        @Index(name = "idx_pks2d_status", columnList = "status")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PortalKs2Draft extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "portal_user_id", nullable = false)
    private UUID portalUserId;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "contract_id")
    private UUID contractId;

    @Column(name = "draft_number", length = 100)
    private String draftNumber;

    @Column(name = "reporting_period_start")
    private LocalDate reportingPeriodStart;

    @Column(name = "reporting_period_end")
    private LocalDate reportingPeriodEnd;

    @Column(name = "total_amount", precision = 19, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "work_description", columnDefinition = "TEXT")
    private String workDescription;

    @Column(name = "lines_json", columnDefinition = "TEXT")
    private String linesJson;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    @Builder.Default
    private PortalKs2DraftStatus status = PortalKs2DraftStatus.DRAFT;

    @Column(name = "submitted_at")
    private Instant submittedAt;

    @Column(name = "review_comment", columnDefinition = "TEXT")
    private String reviewComment;

    @Column(name = "reviewed_by")
    private UUID reviewedBy;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    @Column(name = "linked_ks2_id")
    private UUID linkedKs2Id;
}
