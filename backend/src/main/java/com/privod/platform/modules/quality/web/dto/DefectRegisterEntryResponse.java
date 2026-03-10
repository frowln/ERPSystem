package com.privod.platform.modules.quality.web.dto;

import com.privod.platform.modules.quality.domain.NonConformance;

import java.time.LocalDate;
import java.util.UUID;

public record DefectRegisterEntryResponse(
        UUID id,
        String number,
        String location,
        String defectType,
        String severity,
        LocalDate detectedDate,
        LocalDate deadline,
        String responsibleName,
        String status,
        UUID projectId,
        String projectName
) {
    public static DefectRegisterEntryResponse fromNonConformance(NonConformance nc, String projectName) {
        return new DefectRegisterEntryResponse(
                nc.getId(),
                nc.getCode(),
                null, // location not in current NC entity
                nc.getDescription() != null && nc.getDescription().length() > 80
                        ? nc.getDescription().substring(0, 80) + "..."
                        : nc.getDescription(),
                nc.getSeverity().name().toLowerCase(),
                nc.getCreatedAt() != null
                        ? LocalDate.ofInstant(nc.getCreatedAt(), java.time.ZoneId.systemDefault())
                        : null,
                nc.getDueDate(),
                null, // responsibleName would need a join; return null for now
                nc.getStatus().name().toLowerCase(),
                nc.getProjectId(),
                projectName
        );
    }
}
