package com.privod.platform.modules.quality.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "quality_gate_templates", indexes = {
        @Index(name = "idx_qgt_org", columnList = "organization_id"),
        @Index(name = "idx_qgt_project_template", columnList = "project_template_id")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QualityGateTemplate extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "project_template_id")
    private UUID projectTemplateId;

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "wbs_level_pattern", length = 50)
    private String wbsLevelPattern;

    @Column(name = "required_documents_json", columnDefinition = "TEXT")
    private String requiredDocumentsJson;

    @Column(name = "required_quality_checks_json", columnDefinition = "TEXT")
    private String requiredQualityChecksJson;

    @Column(name = "volume_threshold_percent")
    private Integer volumeThresholdPercent;
}
