package com.privod.platform.modules.analytics.domain;

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
@Table(name = "report_executions", indexes = {
        @Index(name = "idx_execution_report", columnList = "report_id"),
        @Index(name = "idx_execution_status", columnList = "status"),
        @Index(name = "idx_execution_started", columnList = "started_at"),
        @Index(name = "idx_execution_executed_by", columnList = "executed_by_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportExecution extends BaseEntity {

    @Column(name = "report_id", nullable = false)
    private UUID reportId;

    @Column(name = "executed_by_id")
    private UUID executedById;

    @Column(name = "started_at", nullable = false)
    @Builder.Default
    private Instant startedAt = Instant.now();

    @Column(name = "completed_at")
    private Instant completedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private ExecutionStatus status = ExecutionStatus.PENDING;

    @Column(name = "output_url", length = 1000)
    private String outputUrl;

    @Column(name = "output_size")
    private Long outputSize;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "parameters_json", columnDefinition = "JSONB")
    @Builder.Default
    private String parametersJson = "{}";
}
