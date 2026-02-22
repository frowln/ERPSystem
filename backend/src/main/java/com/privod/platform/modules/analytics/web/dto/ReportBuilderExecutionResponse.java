package com.privod.platform.modules.analytics.web.dto;

import com.privod.platform.modules.analytics.domain.ReportBuilderExecution;
import com.privod.platform.modules.analytics.domain.ReportExecutionStatus;
import com.privod.platform.modules.analytics.domain.ReportOutputFormat;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ReportBuilderExecutionResponse(
        UUID id,
        UUID templateId,
        UUID executedById,
        String parametersJson,
        Integer rowCount,
        Long executionTimeMs,
        ReportOutputFormat outputFormat,
        String outputPath,
        ReportExecutionStatus status,
        String statusDisplayName,
        String errorMessage,
        List<Object> data,
        Instant createdAt
) {
    public static ReportBuilderExecutionResponse fromEntity(ReportBuilderExecution execution, List<Object> data) {
        return new ReportBuilderExecutionResponse(
                execution.getId(),
                execution.getTemplateId(),
                execution.getExecutedById(),
                execution.getParametersJson(),
                execution.getRowCount(),
                execution.getExecutionTimeMs(),
                execution.getOutputFormat(),
                execution.getOutputPath(),
                execution.getStatus(),
                execution.getStatus().getDisplayName(),
                execution.getErrorMessage(),
                data,
                execution.getCreatedAt()
        );
    }

    public static ReportBuilderExecutionResponse fromEntity(ReportBuilderExecution execution) {
        return fromEntity(execution, null);
    }
}
