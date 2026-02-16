package com.privod.platform.modules.changeManagement.web.dto;

import com.privod.platform.modules.changeManagement.domain.ChangeOrderStatus;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record ChangeOrderStatusRequest(
        @NotNull(message = "Новый статус обязателен")
        ChangeOrderStatus status,

        UUID approvedById
) {
}
