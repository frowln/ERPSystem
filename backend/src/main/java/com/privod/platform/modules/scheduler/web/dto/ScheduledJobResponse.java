package com.privod.platform.modules.scheduler.web.dto;

import com.privod.platform.modules.scheduler.domain.JobStatus;
import com.privod.platform.modules.scheduler.domain.ScheduledJob;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record ScheduledJobResponse(
        UUID id,
        String code,
        String name,
        String description,
        String cronExpression,
        String jobClass,
        String jobMethod,
        Map<String, Object> parameters,
        boolean isActive,
        Instant lastRunAt,
        JobStatus lastRunStatus,
        String lastRunStatusDisplayName,
        Instant nextRunAt,
        int retryCount,
        int maxRetries,
        Instant createdAt,
        Instant updatedAt
) {
    public static ScheduledJobResponse fromEntity(ScheduledJob entity) {
        return new ScheduledJobResponse(
                entity.getId(),
                entity.getCode(),
                entity.getName(),
                entity.getDescription(),
                entity.getCronExpression(),
                entity.getJobClass(),
                entity.getJobMethod(),
                entity.getParameters(),
                entity.isActive(),
                entity.getLastRunAt(),
                entity.getLastRunStatus(),
                entity.getLastRunStatus() != null ? entity.getLastRunStatus().getDisplayName() : null,
                entity.getNextRunAt(),
                entity.getRetryCount(),
                entity.getMaxRetries(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
