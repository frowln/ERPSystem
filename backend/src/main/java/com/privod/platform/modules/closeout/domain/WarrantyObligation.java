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

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Entity
@Table(name = "warranty_obligations", indexes = {
        @Index(name = "idx_warranty_obl_project", columnList = "project_id"),
        @Index(name = "idx_warranty_obl_status", columnList = "status"),
        @Index(name = "idx_warranty_obl_end_date", columnList = "warranty_end_date"),
        @Index(name = "idx_warranty_obl_handover", columnList = "handover_package_id")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WarrantyObligation extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "handover_package_id")
    private UUID handoverPackageId;

    @Column(name = "title", nullable = false, length = 500)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "system", length = 100)
    private String system;

    @Column(name = "warranty_start_date", nullable = false)
    private LocalDate warrantyStartDate;

    @Column(name = "warranty_end_date", nullable = false)
    private LocalDate warrantyEndDate;

    @Column(name = "contractor_name", length = 255)
    private String contractorName;

    @Column(name = "contractor_contact_info", columnDefinition = "TEXT")
    private String contractorContactInfo;

    @Column(name = "coverage_terms", columnDefinition = "TEXT")
    private String coverageTerms;

    @Column(name = "exclusions", columnDefinition = "TEXT")
    private String exclusions;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private WarrantyObligationStatus status = WarrantyObligationStatus.ACTIVE;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    public long daysRemaining() {
        return ChronoUnit.DAYS.between(LocalDate.now(), warrantyEndDate);
    }

    public boolean isExpired() {
        return LocalDate.now().isAfter(warrantyEndDate);
    }
}
