package com.privod.platform.modules.common.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateFileAttachmentRequest(
        @NotBlank(message = "Entity type is required")
        @Size(max = 50)
        String entityType,

        @NotNull(message = "Entity ID is required")
        UUID entityId,

        @NotBlank(message = "File name is required")
        @Size(max = 500)
        String fileName,

        Long fileSize,

        @Size(max = 100)
        String contentType,

        @Size(max = 1000)
        String storagePath,

        @Size(max = 1000)
        String description
) {}
