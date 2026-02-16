package com.privod.platform.modules.ops.web.dto;

import com.privod.platform.modules.ops.domain.Defect;
import com.privod.platform.modules.ops.domain.DefectSeverity;
import com.privod.platform.modules.ops.domain.DefectStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record DefectResponse(
        UUID id,
        UUID projectId,
        String code,
        String title,
        String description,
        String location,
        DefectSeverity severity,
        String severityDisplayName,
        String photoUrls,
        UUID detectedById,
        UUID assignedToId,
        LocalDate fixDeadline,
        DefectStatus status,
        String statusDisplayName,
        String fixDescription,
        Instant fixedAt,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static DefectResponse fromEntity(Defect d) {
        return new DefectResponse(
                d.getId(),
                d.getProjectId(),
                d.getCode(),
                d.getTitle(),
                d.getDescription(),
                d.getLocation(),
                d.getSeverity(),
                d.getSeverity().getDisplayName(),
                d.getPhotoUrls(),
                d.getDetectedById(),
                d.getAssignedToId(),
                d.getFixDeadline(),
                d.getStatus(),
                d.getStatus().getDisplayName(),
                d.getFixDescription(),
                d.getFixedAt(),
                d.getCreatedAt(),
                d.getUpdatedAt(),
                d.getCreatedBy()
        );
    }
}
