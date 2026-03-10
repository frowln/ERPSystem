package com.privod.platform.modules.admin.web.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record UpdateTenantStatusRequest(
        @NotNull
        @Pattern(regexp = "ACTIVE|SUSPENDED|CANCELLED", message = "Status must be ACTIVE, SUSPENDED, or CANCELLED")
        String status
) {}
