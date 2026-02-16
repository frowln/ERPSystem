package com.privod.platform.modules.pto.web.dto;

import com.privod.platform.modules.pto.domain.PtoDocumentStatus;
import jakarta.validation.constraints.NotNull;

public record ChangePtoStatusRequest(
        @NotNull(message = "Новый статус обязателен")
        PtoDocumentStatus status
) {
}
