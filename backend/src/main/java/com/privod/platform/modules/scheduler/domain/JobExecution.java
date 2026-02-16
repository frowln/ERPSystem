package com.privod.platform.modules.scheduler.domain;

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
@Table(name = "job_executions", indexes = {
        @Index(name = "idx_job_execution_job", columnList = "job_id"),
        @Index(name = "idx_job_execution_status", columnList = "status"),
        @Index(name = "idx_job_execution_started", columnList = "started_at")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobExecution extends BaseEntity {

    @Column(name = "job_id", nullable = false)
    private UUID jobId;

    @Column(name = "started_at", nullable = false)
    @Builder.Default
    private Instant startedAt = Instant.now();

    @Column(name = "completed_at")
    private Instant completedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private JobStatus status = JobStatus.RUNNING;

    @Column(name = "result", columnDefinition = "TEXT")
    private String result;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "error_stack_trace", columnDefinition = "TEXT")
    private String errorStackTrace;

    public void markSuccess(String result) {
        this.status = JobStatus.SUCCESS;
        this.completedAt = Instant.now();
        this.result = result;
    }

    public void markFailed(String errorMessage, String stackTrace) {
        this.status = JobStatus.FAILED;
        this.completedAt = Instant.now();
        this.errorMessage = errorMessage;
        this.errorStackTrace = stackTrace;
    }

    public void markTimeout() {
        this.status = JobStatus.TIMEOUT;
        this.completedAt = Instant.now();
        this.errorMessage = "Execution timed out";
    }
}
