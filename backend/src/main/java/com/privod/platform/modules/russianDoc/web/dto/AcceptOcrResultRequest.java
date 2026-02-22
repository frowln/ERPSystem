package com.privod.platform.modules.russianDoc.web.dto;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;
import java.util.UUID;

public record AcceptOcrResultRequest(
        @NotEmpty(message = "Список ID результатов не может быть пустым")
        List<UUID> resultIds
) {
}
