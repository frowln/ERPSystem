package com.privod.platform.modules.quality.domain;

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
@Table(name = "supervision_entries", indexes = {
        @Index(name = "idx_se_project", columnList = "project_id"),
        @Index(name = "idx_se_compliance", columnList = "compliance_status"),
        @Index(name = "idx_se_entry_date", columnList = "entry_date")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupervisionEntry extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "number", unique = true, length = 20)
    private String number;

    @Column(name = "entry_date", nullable = false)
    private LocalDate entryDate;

    @Column(name = "inspector_name", length = 255)
    private String inspectorName;

    @Column(name = "work_type", length = 500)
    private String workType;

    @Column(name = "remarks", columnDefinition = "TEXT")
    private String remarks;

    @Column(name = "directives", columnDefinition = "TEXT")
    private String directives;

    @Enumerated(EnumType.STRING)
    @Column(name = "compliance_status", nullable = false, length = 30)
    @Builder.Default
    private ComplianceStatus complianceStatus = ComplianceStatus.compliant;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;
}
