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

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "automation_rules", indexes = {
        @Index(name = "idx_auto_rule_entity", columnList = "entity_type"),
        @Index(name = "idx_auto_rule_trigger", columnList = "trigger_type"),
        @Index(name = "idx_auto_rule_action", columnList = "action_type"),
        @Index(name = "idx_auto_rule_org", columnList = "organization_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AutomationRule extends BaseEntity {

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "entity_type", length = 100)
    private String entityType;

    @Enumerated(EnumType.STRING)
    @Column(name = "trigger_type", nullable = false, length = 30)
    private WorkflowTriggerType triggerType;

    @Column(name = "trigger_condition", columnDefinition = "JSONB")
    private String triggerCondition;

    @Enumerated(EnumType.STRING)
    @Column(name = "action_type", nullable = false, length = 30)
    private ActionType actionType;

    @Column(name = "action_config", columnDefinition = "JSONB")
    private String actionConfig;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "organization_id")
    private UUID organizationId;

    @Column(name = "priority", nullable = false)
    @Builder.Default
    private Integer priority = 0;

    @Column(name = "last_executed_at")
    private Instant lastExecutedAt;

    @Column(name = "execution_count", nullable = false)
    @Builder.Default
    private Integer executionCount = 0;
}
