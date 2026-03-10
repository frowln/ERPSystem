package com.privod.platform.modules.hr.web.dto;

import com.privod.platform.modules.hr.domain.HrWorkOrder;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

public record HrWorkOrderResponse(
        UUID id,
        String number,
        String type,
        UUID projectId,
        String projectName,
        String crewName,
        String workDescription,
        LocalDate date,
        LocalDate endDate,
        String safetyRequirements,
        String hazardousConditions,
        List<String> requiredPermits,
        String status
) {
    public static HrWorkOrderResponse fromEntity(HrWorkOrder entity) {
        List<String> permits = entity.getRequiredPermits() != null && !entity.getRequiredPermits().isBlank()
                ? Arrays.asList(entity.getRequiredPermits().split(","))
                : List.of();

        return new HrWorkOrderResponse(
                entity.getId(),
                entity.getNumber(),
                entity.getType().name().toLowerCase(),
                entity.getProjectId(),
                entity.getProjectName(),
                entity.getCrewName(),
                entity.getWorkDescription(),
                entity.getDate(),
                entity.getEndDate(),
                entity.getSafetyRequirements(),
                entity.getHazardousConditions(),
                permits,
                entity.getStatus().name().toLowerCase()
        );
    }
}
