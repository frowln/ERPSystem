package com.privod.platform.modules.bidManagement.domain;

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

import java.time.LocalDateTime;
import java.util.UUID;

@Entity(name = "BidMgmtBidPackage")
@Table(name = "bid_packages", indexes = {
        @Index(name = "idx_bid_pkg_org", columnList = "organization_id"),
        @Index(name = "idx_bid_pkg_project", columnList = "project_id"),
        @Index(name = "idx_bid_pkg_status", columnList = "status")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BidPackage extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private BidPackageStatus status = BidPackageStatus.DRAFT;

    @Column(name = "bid_due_date")
    private LocalDateTime bidDueDate;

    @Column(name = "scope_of_work", columnDefinition = "TEXT")
    private String scopeOfWork;

    @Column(name = "spec_sections", columnDefinition = "TEXT")
    private String specSections;
}
