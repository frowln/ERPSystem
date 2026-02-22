package com.privod.platform.modules.planning.domain;

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
import java.util.UUID;

@Entity
@Table(name = "multi_project_allocations", indexes = {
        @Index(name = "idx_mpa_org", columnList = "organization_id"),
        @Index(name = "idx_mpa_resource", columnList = "resource_id"),
        @Index(name = "idx_mpa_project", columnList = "project_id"),
        @Index(name = "idx_mpa_dates", columnList = "start_date, end_date"),
        @Index(name = "idx_mpa_resource_type", columnList = "resource_type")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MultiProjectAllocation extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Enumerated(EnumType.STRING)
    @Column(name = "resource_type", nullable = false, length = 50)
    private MultiProjectResourceType resourceType;

    @Column(name = "resource_id", nullable = false)
    private UUID resourceId;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "allocation_percent", nullable = false)
    @Builder.Default
    private Integer allocationPercent = 100;

    @Column(name = "role", length = 255)
    private String role;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
