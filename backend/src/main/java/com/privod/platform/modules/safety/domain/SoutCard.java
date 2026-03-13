package com.privod.platform.modules.safety.domain;

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
@Table(name = "safety_sout_cards", indexes = {
        @Index(name = "idx_sout_org", columnList = "organization_id"),
        @Index(name = "idx_sout_project", columnList = "project_id"),
        @Index(name = "idx_sout_status", columnList = "status"),
        @Index(name = "idx_sout_card_number", columnList = "card_number")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SoutCard extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "card_number", length = 50)
    private String cardNumber;

    @Column(name = "workplace_name", nullable = false, length = 500)
    private String workplaceName;

    @Column(name = "workplace_number", length = 50)
    private String workplaceNumber;

    @Column(name = "department", length = 300)
    private String department;

    @Column(name = "position_name", length = 300)
    private String positionName;

    @Column(name = "employee_count")
    @Builder.Default
    private Integer employeeCount = 1;

    @Enumerated(EnumType.STRING)
    @Column(name = "hazard_class", length = 10)
    private SoutHazardClass hazardClass;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private SoutStatus status = SoutStatus.PLANNED;

    @Column(name = "assessment_date")
    private LocalDate assessmentDate;

    @Column(name = "next_assessment_date")
    private LocalDate nextAssessmentDate;

    @Column(name = "assessor_organization", length = 500)
    private String assessorOrganization;

    @Column(name = "harmful_factors", columnDefinition = "TEXT")
    private String harmfulFactors;

    @Column(name = "compensations", columnDefinition = "TEXT")
    private String compensations;

    @Column(name = "ppe_recommendations", columnDefinition = "TEXT")
    private String ppeRecommendations;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
