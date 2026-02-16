package com.privod.platform.modules.russianDoc.web.dto;

import com.privod.platform.modules.russianDoc.domain.RussianDocStatus;
import jakarta.validation.constraints.NotNull;

public record ChangeRussianDocStatusRequest(
        @NotNull(message = "Новый статус обязателен")
        RussianDocStatus status
) {
}
