package com.privod.platform.modules.constructability.web.dto;

import java.util.UUID;

public record UpdateConstructabilityItemRequest(
    String category,
    String description,
    String severity,
    String status,
    String resolution,
    UUID rfiId,
    String assignedTo
) {}
