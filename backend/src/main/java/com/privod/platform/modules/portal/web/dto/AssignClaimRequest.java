package com.privod.platform.modules.portal.web.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record AssignClaimRequest(
        @NotNull(message = "ID подрядчика обязателен")
        UUID contractorId,

        String contractorName
) {
}
