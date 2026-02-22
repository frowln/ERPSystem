package com.privod.platform.modules.cde.domain;

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

import java.util.UUID;

@Entity
@Table(name = "cde_archive_policies", indexes = {
        @Index(name = "idx_cde_archive_policy_org", columnList = "organization_id"),
        @Index(name = "idx_cde_archive_policy_classification", columnList = "classification")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ArchivePolicy extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "classification", length = 30)
    private DocumentClassification classification;

    @Column(name = "retention_days", nullable = false)
    private int retentionDays;

    @Builder.Default
    @Column(name = "auto_archive", nullable = false)
    private boolean autoArchive = false;

    @Builder.Default
    @Column(name = "enabled", nullable = false)
    private boolean enabled = true;
}
