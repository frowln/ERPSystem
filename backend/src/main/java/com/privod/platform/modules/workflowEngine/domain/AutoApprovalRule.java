package com.privod.platform.modules.workflowEngine.domain;

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

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "auto_approval_rules", indexes = {
        @Index(name = "idx_aar_entity_type", columnList = "entity_type"),
        @Index(name = "idx_aar_org", columnList = "organization_id"),
        @Index(name = "idx_aar_project", columnList = "project_id")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AutoApprovalRule extends BaseEntity {

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "entity_type", nullable = false, length = 30)
    private ApprovalEntityType entityType;

    @Column(name = "conditions", columnDefinition = "JSONB")
    private String conditions;

    @Column(name = "auto_approve_threshold", precision = 19, scale = 2)
    private BigDecimal autoApproveThreshold;

    @Column(name = "required_approvers", nullable = false)
    @Builder.Default
    private Integer requiredApprovers = 1;

    @Column(name = "escalation_timeout_hours", nullable = false)
    @Builder.Default
    private Integer escalationTimeoutHours = 24;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "organization_id")
    private UUID organizationId;
}
