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

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "quality_gates", indexes = {
        @Index(name = "idx_qg_project", columnList = "project_id"),
        @Index(name = "idx_qg_wbs_node", columnList = "wbs_node_id"),
        @Index(name = "idx_qg_status", columnList = "status"),
        @Index(name = "idx_qg_org", columnList = "organization_id")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QualityGate extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "wbs_node_id", nullable = false)
    private UUID wbsNodeId;

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "required_documents_json", columnDefinition = "TEXT")
    private String requiredDocumentsJson;

    @Column(name = "required_quality_checks_json", columnDefinition = "TEXT")
    private String requiredQualityChecksJson;

    @Column(name = "volume_threshold_percent")
    private Integer volumeThresholdPercent;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private QualityGateStatus status = QualityGateStatus.NOT_STARTED;

    @Column(name = "doc_completion_percent")
    @Builder.Default
    private Integer docCompletionPercent = 0;

    @Column(name = "quality_completion_percent")
    @Builder.Default
    private Integer qualityCompletionPercent = 0;

    @Column(name = "volume_completion_percent")
    @Builder.Default
    private Integer volumeCompletionPercent = 0;

    @Column(name = "blocked_reason", columnDefinition = "TEXT")
    private String blockedReason;

    @Column(name = "passed_at")
    private Instant passedAt;

    @Column(name = "passed_by")
    private UUID passedBy;
}
