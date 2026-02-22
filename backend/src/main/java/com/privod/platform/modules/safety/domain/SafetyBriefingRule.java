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

import java.util.UUID;

@Entity
@Table(name = "safety_briefing_rules", indexes = {
        @Index(name = "idx_sbr_org", columnList = "organization_id"),
        @Index(name = "idx_sbr_briefing_type", columnList = "briefing_type"),
        @Index(name = "idx_sbr_hazard_type", columnList = "hazard_type")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SafetyBriefingRule extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "role_pattern", length = 500)
    private String rolePattern;

    @Column(name = "hazard_type", length = 200)
    private String hazardType;

    @Enumerated(EnumType.STRING)
    @Column(name = "briefing_type", nullable = false, length = 30)
    private BriefingType briefingType;

    @Column(name = "frequency_days", nullable = false)
    private Integer frequencyDays;

    @Column(name = "required_certificate_types", columnDefinition = "JSONB")
    private String requiredCertificateTypes;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
}
