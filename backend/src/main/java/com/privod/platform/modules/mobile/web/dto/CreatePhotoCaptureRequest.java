package com.privod.platform.modules.mobile.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record CreatePhotoCaptureRequest(
        @NotNull(message = "User ID is required")
        UUID userId,

        UUID projectId,

        @NotBlank(message = "Photo URL is required")
        @Size(max = 1000, message = "Photo URL must not exceed 1000 characters")
        String photoUrl,

        @Size(max = 1000, message = "Thumbnail URL must not exceed 1000 characters")
        String thumbnailUrl,

        Double latitude,

        Double longitude,

        Instant takenAt,

        String entityType,

        UUID entityId,

        @Size(max = 5000, message = "Description must not exceed 5000 characters")
        String description,

        List<String> tags
) {
}
