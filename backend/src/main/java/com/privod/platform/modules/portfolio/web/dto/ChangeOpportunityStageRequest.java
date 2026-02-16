package com.privod.platform.modules.portfolio.web.dto;

import com.privod.platform.modules.portfolio.domain.OpportunityStage;
import jakarta.validation.constraints.NotNull;

public record ChangeOpportunityStageRequest(
        @NotNull(message = "Новый этап обязателен")
        OpportunityStage stage,

        String lostReason,

        java.util.UUID wonProjectId
) {
}
