package com.privod.platform.modules.portfolio.web.dto;

import com.privod.platform.modules.portfolio.domain.ClientType;
import com.privod.platform.modules.portfolio.domain.Opportunity;
import com.privod.platform.modules.portfolio.domain.OpportunityStage;

import java.math.BigDecimal;
import java.math.RoundingMode;
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
        BigDecimal value,
        Integer probability,
        BigDecimal weightedValue,
        LocalDate expectedCloseDate,
        LocalDate actualCloseDate,
        UUID ownerId,
        String ownerName,
        String source,
        String region,
        String projectType,
        String lostReason,
        UUID wonProjectId,
        String tags,
        String goNoGoChecklist,
        Integer checklistScore,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static OpportunityResponse fromEntity(Opportunity o) {
        return fromEntity(o, null);
    }

    public static OpportunityResponse fromEntity(Opportunity o, String resolvedOwnerName) {
        BigDecimal estVal = o.getEstimatedValue() != null ? o.getEstimatedValue() : BigDecimal.ZERO;
        int prob = o.getProbability() != null ? o.getProbability() : 0;
        BigDecimal weighted = estVal.multiply(BigDecimal.valueOf(prob)).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

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
                estVal,
                estVal,
                prob,
                weighted,
                o.getExpectedCloseDate(),
                o.getActualCloseDate(),
                o.getOwnerId(),
                resolvedOwnerName != null ? resolvedOwnerName : "Не назначен",
                o.getSource(),
                o.getRegion(),
                o.getProjectType(),
                o.getLostReason(),
                o.getWonProjectId(),
                o.getTags(),
                o.getGoNoGoChecklist(),
                o.getChecklistScore(),
                o.getCreatedAt(),
                o.getUpdatedAt(),
                o.getCreatedBy()
        );
    }
}
