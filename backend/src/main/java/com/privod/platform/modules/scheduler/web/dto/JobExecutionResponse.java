package com.privod.platform.modules.scheduler.web.dto;

import com.privod.platform.modules.scheduler.domain.JobExecution;
import com.privod.platform.modules.scheduler.domain.JobStatus;

import java.time.Instant;
import java.util.UUID;

public record JobExecutionResponse(
        UUID id,
        UUID jobId,
        Instant startedAt,
        Instant completedAt,
        JobStatus status,
        String statusDisplayName,
        String result,
        String errorMessage,
        String errorStackTrace,
        Instant createdAt
) {
    public static JobExecutionResponse fromEntity(JobExecution entity) {
        return new JobExecutionResponse(
                entity.getId(),
                entity.getJobId(),
                entity.getStartedAt(),
                entity.getCompletedAt(),
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getResult(),
                entity.getErrorMessage(),
                entity.getErrorStackTrace(),
                entity.getCreatedAt()
        );
    }
}
