package com.privod.platform.modules.crm.web.dto;

import com.privod.platform.modules.crm.domain.CrmStage;

import java.math.BigDecimal;
import java.util.UUID;

public record CrmStageResponse(
        UUID id,
        String name,
        int sequence,
        int probability,
        boolean closed,
        boolean won,
        boolean isWon,
        boolean isClosed,
        String requirements,
        long leadCount,
        BigDecimal totalRevenue
) {
    public static CrmStageResponse fromEntity(CrmStage stage) {
        return fromEntity(stage, 0, BigDecimal.ZERO);
    }

    public static CrmStageResponse fromEntity(CrmStage stage, long leadCount, BigDecimal totalRevenue) {
        return new CrmStageResponse(
                stage.getId(),
                stage.getName(),
                stage.getSequence(),
                stage.getProbability(),
                stage.isClosed(),
                stage.isWon(),
                stage.isWon(),
                stage.isClosed(),
                stage.getRequirements(),
                leadCount,
                totalRevenue != null ? totalRevenue : BigDecimal.ZERO
        );
    }
}
