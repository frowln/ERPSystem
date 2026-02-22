package com.privod.platform.modules.safety.web.dto;

import java.util.UUID;

public record RecalculateRiskRequest(
        UUID projectId
) {
}
