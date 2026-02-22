package com.privod.platform.modules.closeout.web.dto;

import com.privod.platform.modules.closeout.domain.SignOffDecision;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreateCommissioningSignOffRequest(
        @NotNull(message = "ID чек-листа обязателен")
        UUID checklistId,

        @NotBlank(message = "Имя подписанта обязательно")
        String signerName,

        String signerRole,

        String signerOrganization,

        @NotNull(message = "Решение обязательно")
        SignOffDecision decision,

        String comments
) {
}
