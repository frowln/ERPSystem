package com.privod.platform.modules.punchlist.web.dto;

import com.privod.platform.modules.punchlist.domain.PunchItem;
import com.privod.platform.modules.punchlist.domain.PunchItemPriority;
import com.privod.platform.modules.punchlist.domain.PunchItemStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record PunchItemResponse(
        UUID id,
        UUID punchListId,
        Integer number,
        String description,
        String location,
        String category,
        PunchItemPriority priority,
        String priorityDisplayName,
        PunchItemStatus status,
        String statusDisplayName,
        UUID assignedToId,
        String photoUrls,
        LocalDate fixDeadline,
        Instant fixedAt,
        UUID verifiedById,
        Instant verifiedAt,
        Instant createdAt,
        Instant updatedAt
) {
    public static PunchItemResponse fromEntity(PunchItem item) {
        return new PunchItemResponse(
                item.getId(),
                item.getPunchListId(),
                item.getNumber(),
                item.getDescription(),
                item.getLocation(),
                item.getCategory(),
                item.getPriority(),
                item.getPriority().getDisplayName(),
                item.getStatus(),
                item.getStatus().getDisplayName(),
                item.getAssignedToId(),
                item.getPhotoUrls(),
                item.getFixDeadline(),
                item.getFixedAt(),
                item.getVerifiedById(),
                item.getVerifiedAt(),
                item.getCreatedAt(),
                item.getUpdatedAt()
        );
    }
}
