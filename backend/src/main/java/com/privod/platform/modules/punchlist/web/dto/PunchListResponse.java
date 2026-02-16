package com.privod.platform.modules.punchlist.web.dto;

import com.privod.platform.modules.punchlist.domain.PunchList;
import com.privod.platform.modules.punchlist.domain.PunchListStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record PunchListResponse(
        UUID id,
        UUID projectId,
        String code,
        String name,
        UUID createdById,
        LocalDate dueDate,
        PunchListStatus status,
        String statusDisplayName,
        Integer completionPercent,
        String areaOrZone,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static PunchListResponse fromEntity(PunchList punchList) {
        return new PunchListResponse(
                punchList.getId(),
                punchList.getProjectId(),
                punchList.getCode(),
                punchList.getName(),
                punchList.getCreatedById(),
                punchList.getDueDate(),
                punchList.getStatus(),
                punchList.getStatus().getDisplayName(),
                punchList.getCompletionPercent(),
                punchList.getAreaOrZone(),
                punchList.getCreatedAt(),
                punchList.getUpdatedAt(),
                punchList.getCreatedBy()
        );
    }
}
