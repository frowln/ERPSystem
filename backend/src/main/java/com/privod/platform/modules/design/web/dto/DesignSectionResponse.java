package com.privod.platform.modules.design.web.dto;

import com.privod.platform.modules.design.domain.DesignSection;

import java.time.Instant;
import java.util.UUID;

public record DesignSectionResponse(
        UUID id,
        UUID projectId,
        String name,
        String code,
        String discipline,
        UUID parentId,
        int sequence,
        String description,
        Instant createdAt,
        Instant updatedAt
) {
    public static DesignSectionResponse fromEntity(DesignSection ds) {
        return new DesignSectionResponse(
                ds.getId(),
                ds.getProjectId(),
                ds.getName(),
                ds.getCode(),
                ds.getDiscipline(),
                ds.getParentId(),
                ds.getSequence(),
                ds.getDescription(),
                ds.getCreatedAt(),
                ds.getUpdatedAt()
        );
    }
}
