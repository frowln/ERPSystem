package com.privod.platform.modules.portfolio.domain;

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
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "bid_packages", indexes = {
        @Index(name = "idx_bid_package_opportunity", columnList = "opportunity_id"),
        @Index(name = "idx_bid_package_status", columnList = "status"),
        @Index(name = "idx_bid_package_manager", columnList = "bid_manager_id"),
        @Index(name = "idx_bid_package_deadline", columnList = "submission_deadline")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BidPackage extends BaseEntity {

    @Column(name = "opportunity_id")
    private UUID opportunityId;

    @Column(name = "project_name", nullable = false, length = 500)
    private String projectName;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private BidStatus status = BidStatus.DRAFT;

    @Column(name = "bid_number", length = 100)
    private String bidNumber;

    @Column(name = "client_organization", length = 500)
    private String clientOrganization;

    @Column(name = "submission_deadline")
    private LocalDateTime submissionDeadline;

    @Column(name = "submission_date")
    private LocalDateTime submissionDate;

    @Column(name = "bid_amount", precision = 18, scale = 2)
    private BigDecimal bidAmount;

    @Column(name = "estimated_cost", precision = 18, scale = 2)
    private BigDecimal estimatedCost;

    @Column(name = "estimated_margin", precision = 18, scale = 2)
    private BigDecimal estimatedMargin;

    @Column(name = "bid_manager_id")
    private UUID bidManagerId;

    @Column(name = "technical_lead_id")
    private UUID technicalLeadId;

    @Column(name = "bond_required", nullable = false)
    @Builder.Default
    private Boolean bondRequired = false;

    @Column(name = "bond_amount", precision = 18, scale = 2)
    private BigDecimal bondAmount;

    @Column(name = "documents", columnDefinition = "JSONB")
    private String documents;

    @Column(name = "competitor_info", columnDefinition = "JSONB")
    private String competitorInfo;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
