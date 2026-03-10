package com.privod.platform.modules.admin.web.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record UpdateTenantPlanRequest(
        @NotNull
        UUID planId
) {}
