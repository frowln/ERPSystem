package com.privod.platform.modules.integration1c.web.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record Integration1cConfigRequest(
        @NotBlank(message = "Base URL is required")
        String baseUrl,

        @NotBlank(message = "Username is required")
        String username,

        String password,

        String databaseName,

        boolean syncEnabled,

        @Min(value = 1, message = "Sync interval must be at least 1 minute")
        @Max(value = 1440, message = "Sync interval must not exceed 1440 minutes (24 hours)")
        int syncIntervalMinutes
) {
    public Integration1cConfigRequest {
        if (syncIntervalMinutes == 0) {
            syncIntervalMinutes = 60;
        }
    }
}
