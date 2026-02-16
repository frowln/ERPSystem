package com.privod.platform.modules.immutableAudit.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record SupersedeRecordRequest(
        @NotNull(message = "ID исходной записи обязателен")
        UUID originalRecordId,

        @NotBlank(message = "Причина замещения обязательна")
        String reason,

        @NotBlank(message = "Новый снимок содержимого обязателен")
        String newContentSnapshot,

        @NotNull(message = "ID пользователя обязателен")
        UUID supersededById
) {
}
