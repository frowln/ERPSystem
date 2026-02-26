package com.privod.platform.modules.subscription.web.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record ChangePlanRequest(
        @NotNull UUID planId
) {
}
