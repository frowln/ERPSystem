package com.privod.platform.modules.bidScoring.domain;

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
@Table(name = "bid_comparisons", indexes = {
        @Index(name = "idx_bid_comparison_org", columnList = "organization_id"),
        @Index(name = "idx_bid_comparison_org_project", columnList = "organization_id, project_id"),
        @Index(name = "idx_bid_comparison_project", columnList = "project_id"),
        @Index(name = "idx_bid_comparison_status", columnList = "status"),
        @Index(name = "idx_bid_comparison_created_by", columnList = "created_by_id")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BidComparison extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "title", nullable = false, length = 500)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private ComparisonStatus status = ComparisonStatus.DRAFT;

    @Column(name = "rfq_number", length = 100)
    private String rfqNumber;

    @Column(name = "category", length = 255)
    private String category;

    @Column(name = "created_by_id")
    private UUID createdById;

    @Column(name = "approved_by_id")
    private UUID approvedById;

    @Column(name = "approved_at")
    private Instant approvedAt;

    @Column(name = "winner_vendor_id")
    private UUID winnerVendorId;

    @Column(name = "winner_justification", columnDefinition = "TEXT")
    private String winnerJustification;
}
