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
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;

@Entity
@Table(name = "scheduled_jobs", indexes = {
        @Index(name = "idx_scheduled_job_code", columnList = "code", unique = true),
        @Index(name = "idx_scheduled_job_next_run", columnList = "next_run_at")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScheduledJob extends BaseEntity {

    @Column(name = "code", nullable = false, unique = true, length = 100)
    private String code;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "cron_expression", nullable = false, length = 100)
    private String cronExpression;

    @Column(name = "job_class", nullable = false, length = 500)
    private String jobClass;

    @Column(name = "job_method", nullable = false, length = 255)
    private String jobMethod;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "parameters", columnDefinition = "jsonb")
    @Builder.Default
    private Map<String, Object> parameters = Map.of();

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @Column(name = "last_run_at")
    private Instant lastRunAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "last_run_status", length = 20)
    private JobStatus lastRunStatus;

    @Column(name = "next_run_at")
    private Instant nextRunAt;

    @Column(name = "retry_count", nullable = false)
    @Builder.Default
    private int retryCount = 0;

    @Column(name = "max_retries", nullable = false)
    @Builder.Default
    private int maxRetries = 3;

    public void recordSuccess() {
        this.lastRunAt = Instant.now();
        this.lastRunStatus = JobStatus.SUCCESS;
        this.retryCount = 0;
    }

    public void recordFailure() {
        this.lastRunAt = Instant.now();
        this.lastRunStatus = JobStatus.FAILED;
        this.retryCount = this.retryCount + 1;
    }

    public boolean canRetry() {
        return this.retryCount < this.maxRetries;
    }
}
