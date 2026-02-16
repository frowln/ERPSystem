package com.privod.platform.modules.crm.web.dto;

import com.privod.platform.modules.crm.domain.CrmStage;

import java.util.UUID;

public record CrmStageResponse(
        UUID id,
        String name,
        int sequence,
        int probability,
        boolean closed,
        boolean won,
        String requirements
) {
    public static CrmStageResponse fromEntity(CrmStage stage) {
        return new CrmStageResponse(
                stage.getId(),
                stage.getName(),
                stage.getSequence(),
                stage.getProbability(),
                stage.isClosed(),
                stage.isWon(),
                stage.getRequirements()
        );
    }
}
