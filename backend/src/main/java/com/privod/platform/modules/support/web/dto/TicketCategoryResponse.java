package com.privod.platform.modules.support.web.dto;

import com.privod.platform.modules.support.domain.TicketCategory;

import java.time.Instant;
import java.util.UUID;

public record TicketCategoryResponse(
        UUID id,
        String code,
        String name,
        String description,
        UUID defaultAssigneeId,
        Integer slaHours,
        boolean isActive,
        Instant createdAt,
        Instant updatedAt
) {
    public static TicketCategoryResponse fromEntity(TicketCategory category) {
        return new TicketCategoryResponse(
                category.getId(),
                category.getCode(),
                category.getName(),
                category.getDescription(),
                category.getDefaultAssigneeId(),
                category.getSlaHours(),
                category.isActive(),
                category.getCreatedAt(),
                category.getUpdatedAt()
        );
    }
}
