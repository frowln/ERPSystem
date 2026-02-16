package com.privod.platform.modules.planning.web.dto;

import com.privod.platform.modules.planning.domain.DependencyType;
import com.privod.platform.modules.planning.domain.WbsDependency;

import java.time.Instant;
import java.util.UUID;

public record WbsDependencyResponse(
        UUID id,
        UUID predecessorId,
        UUID successorId,
        DependencyType dependencyType,
        String dependencyTypeDisplayName,
        Integer lagDays,
        Instant createdAt
) {
    public static WbsDependencyResponse fromEntity(WbsDependency dep) {
        return new WbsDependencyResponse(
                dep.getId(),
                dep.getPredecessorId(),
                dep.getSuccessorId(),
                dep.getDependencyType(),
                dep.getDependencyType().getDisplayName(),
                dep.getLagDays(),
                dep.getCreatedAt()
        );
    }
}
