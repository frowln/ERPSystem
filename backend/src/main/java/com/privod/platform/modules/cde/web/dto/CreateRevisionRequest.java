package com.privod.platform.modules.cde.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateRevisionRequest(
        @NotBlank(message = "Номер ревизии обязателен")
        @Size(max = 20, message = "Номер ревизии не должен превышать 20 символов")
        String revisionNumber,

        String description,

        UUID fileId,

        @Size(max = 500)
        String fileName,

        Long fileSize,

        @Size(max = 100)
        String mimeType
) {
}
