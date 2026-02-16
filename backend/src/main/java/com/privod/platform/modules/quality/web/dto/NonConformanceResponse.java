package com.privod.platform.modules.quality.web.dto;

import com.privod.platform.modules.quality.domain.NonConformance;
import com.privod.platform.modules.quality.domain.NonConformanceSeverity;
import com.privod.platform.modules.quality.domain.NonConformanceStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record NonConformanceResponse(
        UUID id,
        String code,
        UUID qualityCheckId,
        UUID projectId,
        NonConformanceSeverity severity,
        String severityDisplayName,
        String description,
        String rootCause,
        String correctiveAction,
        String preventiveAction,
        NonConformanceStatus status,
        String statusDisplayName,
        UUID responsibleId,
        LocalDate dueDate,
        LocalDate resolvedDate,
        BigDecimal cost,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static NonConformanceResponse fromEntity(NonConformance entity) {
        return new NonConformanceResponse(
                entity.getId(),
                entity.getCode(),
                entity.getQualityCheckId(),
                entity.getProjectId(),
                entity.getSeverity(),
                entity.getSeverity().getDisplayName(),
                entity.getDescription(),
                entity.getRootCause(),
                entity.getCorrectiveAction(),
                entity.getPreventiveAction(),
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getResponsibleId(),
                entity.getDueDate(),
                entity.getResolvedDate(),
                entity.getCost(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
