package com.privod.platform.modules.planning.web.dto;

import com.privod.platform.modules.planning.domain.AllocationScenario;

import java.time.Instant;
import java.util.UUID;

public record AllocationScenarioResponse(
        UUID id,
        UUID organizationId,
        String name,
        String description,
        String scenarioDataJson,
        String resultJson,
        Instant createdAt,
        Instant updatedAt
) {
    public static AllocationScenarioResponse fromEntity(AllocationScenario scenario) {
        return new AllocationScenarioResponse(
                scenario.getId(),
                scenario.getOrganizationId(),
                scenario.getName(),
                scenario.getDescription(),
                scenario.getScenarioDataJson(),
                scenario.getResultJson(),
                scenario.getCreatedAt(),
                scenario.getUpdatedAt()
        );
    }
}
