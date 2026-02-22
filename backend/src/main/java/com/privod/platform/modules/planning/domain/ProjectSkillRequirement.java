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

import java.util.UUID;

@Entity
@Table(name = "project_skill_requirements", indexes = {
        @Index(name = "idx_psr_org", columnList = "organization_id"),
        @Index(name = "idx_psr_project", columnList = "project_id"),
        @Index(name = "idx_psr_skill", columnList = "skill_name")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectSkillRequirement extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "skill_name", nullable = false, length = 255)
    private String skillName;

    @Enumerated(EnumType.STRING)
    @Column(name = "skill_category", length = 100)
    private SkillCategory skillCategory;

    @Column(name = "minimum_proficiency", nullable = false)
    @Builder.Default
    private Integer minimumProficiency = 1;

    @Column(name = "required_count", nullable = false)
    @Builder.Default
    private Integer requiredCount = 1;

    @Column(name = "is_mandatory", nullable = false)
    @Builder.Default
    private Boolean isMandatory = true;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
