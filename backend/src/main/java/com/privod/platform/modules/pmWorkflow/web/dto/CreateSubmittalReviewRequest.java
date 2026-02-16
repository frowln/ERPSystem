package com.privod.platform.modules.pmWorkflow.web.dto;

import com.privod.platform.modules.pmWorkflow.domain.SubmittalStatus;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreateSubmittalReviewRequest(
        @NotNull(message = "Идентификатор сабмитала обязателен")
        UUID submittalId,

        @NotNull(message = "Идентификатор рецензента обязателен")
        UUID reviewerId,

        SubmittalStatus status,

        String comments,

        String stampType,

        String attachmentIds
) {
}
