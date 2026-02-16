package com.privod.platform.modules.ops.web.dto;

import com.privod.platform.modules.ops.domain.WorkOrder;
import com.privod.platform.modules.ops.domain.WorkOrderPriority;
import com.privod.platform.modules.ops.domain.WorkOrderStatus;
import com.privod.platform.modules.ops.domain.WorkType;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record WorkOrderResponse(
        UUID id,
        UUID projectId,
        String code,
        String title,
        String description,
        WorkType workType,
        String workTypeDisplayName,
        String location,
        UUID assignedCrewId,
        UUID foremanId,
        LocalDate plannedStart,
        LocalDate plannedEnd,
        LocalDate actualStart,
        LocalDate actualEnd,
        WorkOrderStatus status,
        String statusDisplayName,
        WorkOrderPriority priority,
        String priorityDisplayName,
        Integer completionPercent,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static WorkOrderResponse fromEntity(WorkOrder wo) {
        return new WorkOrderResponse(
                wo.getId(),
                wo.getProjectId(),
                wo.getCode(),
                wo.getTitle(),
                wo.getDescription(),
                wo.getWorkType(),
                wo.getWorkType().getDisplayName(),
                wo.getLocation(),
                wo.getAssignedCrewId(),
                wo.getForemanId(),
                wo.getPlannedStart(),
                wo.getPlannedEnd(),
                wo.getActualStart(),
                wo.getActualEnd(),
                wo.getStatus(),
                wo.getStatus().getDisplayName(),
                wo.getPriority(),
                wo.getPriority().getDisplayName(),
                wo.getCompletionPercent(),
                wo.getCreatedAt(),
                wo.getUpdatedAt(),
                wo.getCreatedBy()
        );
    }
}
