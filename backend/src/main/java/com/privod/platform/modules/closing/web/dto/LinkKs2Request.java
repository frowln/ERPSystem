package com.privod.platform.modules.closing.web.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record LinkKs2Request(
        @NotNull(message = "Идентификатор КС-2 обязателен")
        UUID ks2Id
) {
}
