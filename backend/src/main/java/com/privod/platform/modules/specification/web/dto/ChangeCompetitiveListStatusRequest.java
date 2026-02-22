package com.privod.platform.modules.specification.web.dto;

import com.privod.platform.modules.specification.domain.CompetitiveListStatus;
import jakarta.validation.constraints.NotNull;

public record ChangeCompetitiveListStatusRequest(
        @NotNull(message = "Новый статус обязателен")
        CompetitiveListStatus status
) {
}
