package com.privod.platform.modules.admin.web.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record ExtendSubscriptionRequest(
        @NotNull
        @Min(1)
        @Max(60)
        Integer months
) {}
