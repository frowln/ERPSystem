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

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "employee_skills", indexes = {
        @Index(name = "idx_es_org", columnList = "organization_id"),
        @Index(name = "idx_es_employee", columnList = "employee_id"),
        @Index(name = "idx_es_skill", columnList = "skill_name"),
        @Index(name = "idx_es_category", columnList = "skill_category"),
        @Index(name = "idx_es_proficiency", columnList = "proficiency_level"),
        @Index(name = "idx_es_certified", columnList = "certified_until")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeSkill extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "skill_name", nullable = false, length = 255)
    private String skillName;

    @Enumerated(EnumType.STRING)
    @Column(name = "skill_category", length = 100)
    private SkillCategory skillCategory;

    @Column(name = "proficiency_level", nullable = false)
    @Builder.Default
    private Integer proficiencyLevel = 1;

    @Column(name = "certified_until")
    private LocalDate certifiedUntil;

    @Column(name = "certification_number", length = 100)
    private String certificationNumber;

    @Column(name = "verified_at")
    private Instant verifiedAt;

    @Column(name = "verified_by")
    private UUID verifiedBy;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
