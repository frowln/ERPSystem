package com.privod.platform.modules.specification.domain;

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
@Table(name = "specifications", indexes = {
        @Index(name = "idx_spec_project", columnList = "project_id"),
        @Index(name = "idx_spec_contract", columnList = "contract_id"),
        @Index(name = "idx_spec_status", columnList = "status"),
        @Index(name = "idx_spec_parent_version", columnList = "parent_version_id")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Specification extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    /** Auto-generated identifier, e.g. SPEC-00031 */
    @Column(name = "name", nullable = false, unique = true, length = 50)
    private String name;

    /** User-provided display title, e.g. "Система отопления ИТП" */
    @Column(name = "title", length = 500)
    private String title;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    /** Denormalized project name for fast list display */
    @Column(name = "project_name", length = 300)
    private String projectName;

    @Column(name = "contract_id")
    private UUID contractId;

    @Column(name = "doc_version", nullable = false)
    @Builder.Default
    private Integer docVersion = 1;

    @Column(name = "is_current", nullable = false)
    @Builder.Default
    private boolean isCurrent = true;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private SpecificationStatus status = SpecificationStatus.DRAFT;

    @Column(name = "parent_version_id")
    private UUID parentVersionId;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    public boolean canTransitionTo(SpecificationStatus newStatus) {
        return this.status.canTransitionTo(newStatus);
    }

    /** Display name: title if set, otherwise auto-generated name */
    public String getDisplayName() {
        return (title != null && !title.isBlank()) ? title : name;
    }
}
