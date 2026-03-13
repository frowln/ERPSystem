package com.privod.platform.modules.hr.web.dto;

import com.privod.platform.modules.hr.domain.Crew;

import java.time.Instant;
import java.util.UUID;

public record CrewResponse(
        UUID id,
        UUID organizationId,
        String name,
        UUID foremanId,
        String foremanName,
        String foremanPhone,
        int workersCount,
        UUID currentProjectId,
        String currentProject,
        String status,
        String specialization,
        Integer performance,
        int activeOrders,
        Instant createdAt,
        Instant updatedAt
) {
    public static CrewResponse fromEntity(Crew entity) {
        return new CrewResponse(
                entity.getId(),
                entity.getOrganizationId(),
                entity.getName(),
                entity.getForemanId(),
                entity.getForemanName(),
                entity.getForemanPhone(),
                entity.getWorkersCount(),
                entity.getCurrentProjectId(),
                entity.getCurrentProject(),
                entity.getStatus() != null ? entity.getStatus().name().toLowerCase() : null,
                entity.getSpecialization(),
                entity.getPerformance(),
                entity.getActiveOrders(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
