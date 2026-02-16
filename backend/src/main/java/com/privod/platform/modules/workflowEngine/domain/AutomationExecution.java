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
@Table(name = "automation_executions", indexes = {
        @Index(name = "idx_auto_exec_rule", columnList = "automation_rule_id"),
        @Index(name = "idx_auto_exec_entity", columnList = "entity_id, entity_type"),
        @Index(name = "idx_auto_exec_status", columnList = "execution_status")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AutomationExecution extends BaseEntity {

    @Column(name = "automation_rule_id", nullable = false)
    private UUID automationRuleId;

    @Column(name = "entity_id")
    private UUID entityId;

    @Column(name = "entity_type", length = 100)
    private String entityType;

    @Enumerated(EnumType.STRING)
    @Column(name = "execution_status", nullable = false, length = 20)
    @Builder.Default
    private ExecutionStatus executionStatus = ExecutionStatus.PENDING;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "trigger_data", columnDefinition = "JSONB")
    private String triggerData;

    @Column(name = "result_data", columnDefinition = "JSONB")
    private String resultData;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;
}
