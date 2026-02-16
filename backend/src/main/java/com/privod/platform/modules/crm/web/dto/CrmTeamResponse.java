package com.privod.platform.modules.crm.web.dto;

import com.privod.platform.modules.crm.domain.CrmTeam;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record CrmTeamResponse(
        UUID id,
        String name,
        UUID leaderId,
        String memberIds,
        BigDecimal targetRevenue,
        String color,
        boolean active,
        Instant createdAt,
        Instant updatedAt
) {
    public static CrmTeamResponse fromEntity(CrmTeam team) {
        return new CrmTeamResponse(
                team.getId(),
                team.getName(),
                team.getLeaderId(),
                team.getMemberIds(),
                team.getTargetRevenue(),
                team.getColor(),
                team.isActive(),
                team.getCreatedAt(),
                team.getUpdatedAt()
        );
    }
}
