package com.privod.platform.modules.russianDoc.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateOcrTaskRequest(
        @NotBlank(message = "URL файла обязателен")
        @Size(max = 2000)
        String fileUrl,

        @NotBlank(message = "Имя файла обязательно")
        @Size(max = 500)
        String fileName,

        UUID organizationId,

        UUID projectId
) {
}
