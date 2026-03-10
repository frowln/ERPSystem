package com.privod.platform.modules.constructability.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreateConstructabilityItemRequest(
    @NotNull String category,
    @NotBlank String description,
    String severity,
    String status,
    String resolution,
    UUID rfiId,
    String assignedTo
) {}
