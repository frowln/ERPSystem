package com.privod.platform.modules.portal.web.dto;

import com.privod.platform.modules.portal.domain.ClientMilestone;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record ClientMilestoneResponse(
        UUID id,
        UUID organizationId,
        UUID projectId,
        String title,
        String description,
        LocalDate targetDate,
        LocalDate actualDate,
        String status,
        String statusDisplayName,
        Integer sortOrder,
        boolean visibleToClient,
        Instant createdAt,
        Instant updatedAt
) {
    public static ClientMilestoneResponse fromEntity(ClientMilestone m) {
        return new ClientMilestoneResponse(
                m.getId(),
                m.getOrganizationId(),
                m.getProjectId(),
                m.getTitle(),
                m.getDescription(),
                m.getTargetDate(),
                m.getActualDate(),
                m.getStatus() != null ? m.getStatus().name() : null,
                m.getStatus() != null ? m.getStatus().getDisplayName() : null,
                m.getSortOrder(),
                m.isVisibleToClient(),
                m.getCreatedAt(),
                m.getUpdatedAt()
        );
    }
}
