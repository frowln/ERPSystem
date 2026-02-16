package com.privod.platform.modules.portfolio.web.dto;

import com.privod.platform.modules.portfolio.domain.ClientType;
import com.privod.platform.modules.portfolio.domain.Opportunity;
import com.privod.platform.modules.portfolio.domain.OpportunityStage;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record OpportunityResponse(
        UUID id,
        UUID organizationId,
        String name,
        String description,
        String clientName,
        ClientType clientType,
        String clientTypeDisplayName,
        OpportunityStage stage,
        String stageDisplayName,
        BigDecimal estimatedValue,
        Integer probability,
        LocalDate expectedCloseDate,
        LocalDate actualCloseDate,
        UUID ownerId,
        String source,
        String region,
        String projectType,
        String lostReason,
        UUID wonProjectId,
        String tags,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static OpportunityResponse fromEntity(Opportunity o) {
        return new OpportunityResponse(
                o.getId(),
                o.getOrganizationId(),
                o.getName(),
                o.getDescription(),
                o.getClientName(),
                o.getClientType(),
                o.getClientType() != null ? o.getClientType().getDisplayName() : null,
                o.getStage(),
                o.getStage().getDisplayName(),
                o.getEstimatedValue(),
                o.getProbability(),
                o.getExpectedCloseDate(),
                o.getActualCloseDate(),
                o.getOwnerId(),
                o.getSource(),
                o.getRegion(),
                o.getProjectType(),
                o.getLostReason(),
                o.getWonProjectId(),
                o.getTags(),
                o.getCreatedAt(),
                o.getUpdatedAt(),
                o.getCreatedBy()
        );
    }
}
