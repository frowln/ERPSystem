package com.privod.platform.modules.analytics.web.dto;

import com.privod.platform.modules.analytics.domain.ExecutionStatus;
import com.privod.platform.modules.analytics.domain.ReportExecution;

import java.time.Instant;
import java.util.UUID;

public record ReportExecutionResponse(
        UUID id,
        UUID reportId,
        UUID executedById,
        Instant startedAt,
        Instant completedAt,
        ExecutionStatus status,
        String statusDisplayName,
        String outputUrl,
        Long outputSize,
        String errorMessage,
        String parametersJson,
        Instant createdAt
) {
    public static ReportExecutionResponse fromEntity(ReportExecution execution) {
        return new ReportExecutionResponse(
                execution.getId(),
                execution.getReportId(),
                execution.getExecutedById(),
                execution.getStartedAt(),
                execution.getCompletedAt(),
                execution.getStatus(),
                execution.getStatus().getDisplayName(),
                execution.getOutputUrl(),
                execution.getOutputSize(),
                execution.getErrorMessage(),
                execution.getParametersJson(),
                execution.getCreatedAt()
        );
    }
}
