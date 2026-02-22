package com.privod.platform.modules.bidScoring.web.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record UpsertBidScoresBatchRequest(
        @NotEmpty(message = "Список оценок не может быть пустым")
        List<@Valid CreateBidScoreRequest> scores
) {
}
