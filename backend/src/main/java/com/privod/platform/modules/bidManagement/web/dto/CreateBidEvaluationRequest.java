package com.privod.platform.modules.bidManagement.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record CreateBidEvaluationRequest(
        @NotNull UUID invitationId,
        @NotBlank String criteriaName,
        Integer score,
        Integer maxScore,
        BigDecimal weight,
        String notes,
        String evaluatorName
) {}
