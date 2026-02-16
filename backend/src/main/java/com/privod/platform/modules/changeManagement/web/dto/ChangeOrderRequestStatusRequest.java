package com.privod.platform.modules.changeManagement.web.dto;

import com.privod.platform.modules.changeManagement.domain.ChangeOrderRequestStatus;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record ChangeOrderRequestStatusRequest(
        @NotNull(message = "Новый статус обязателен")
        ChangeOrderRequestStatus status,

        UUID reviewedById,

        String reviewComments
) {
}
