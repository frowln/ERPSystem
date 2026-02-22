package com.privod.platform.modules.commercialProposal.web.dto;

import com.privod.platform.modules.commercialProposal.domain.ProposalStatus;
import jakarta.validation.constraints.NotNull;

public record ChangeProposalStatusRequest(
        @NotNull(message = "Статус обязателен")
        ProposalStatus status
) {
}
