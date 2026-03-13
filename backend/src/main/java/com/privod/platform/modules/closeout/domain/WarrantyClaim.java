package com.privod.platform.modules.closeout.domain;

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
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "warranty_claims", indexes = {
        @Index(name = "idx_warranty_project", columnList = "project_id"),
        @Index(name = "idx_warranty_handover", columnList = "handover_package_id"),
        @Index(name = "idx_warranty_status", columnList = "status"),
        @Index(name = "idx_warranty_assigned", columnList = "assigned_to_id"),
        @Index(name = "idx_warranty_reported_by", columnList = "reported_by_id"),
        @Index(name = "idx_warranty_expiry", columnList = "warranty_expiry_date")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WarrantyClaim extends BaseEntity {

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "handover_package_id")
    private UUID handoverPackageId;

    @Column(name = "claim_number", length = 50)
    private String claimNumber;

    @Column(name = "title", nullable = false, length = 500)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private WarrantyClaimStatus status = WarrantyClaimStatus.OPEN;

    @Column(name = "defect_type", length = 100)
    private String defectType;

    @Column(name = "location", length = 500)
    private String location;

    @Column(name = "reported_by_id")
    private UUID reportedById;

    @Column(name = "reported_date")
    private LocalDate reportedDate;

    @Column(name = "warranty_expiry_date")
    private LocalDate warrantyExpiryDate;

    @Column(name = "assigned_to_id")
    private UUID assignedToId;

    @Column(name = "resolved_date")
    private LocalDate resolvedDate;

    @Column(name = "resolution_description", columnDefinition = "TEXT")
    private String resolutionDescription;

    @Column(name = "cost_of_repair", precision = 18, scale = 2)
    private BigDecimal costOfRepair;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "attachment_ids", columnDefinition = "JSONB")
    private String attachmentIds;
}
