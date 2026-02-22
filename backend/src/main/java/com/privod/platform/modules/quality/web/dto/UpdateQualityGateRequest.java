package com.privod.platform.modules.quality.web.dto;

import java.util.UUID;

public record UpdateQualityGateRequest(
        String name,
        String description,
        UUID wbsNodeId,
        String requiredDocumentsJson,
        String requiredQualityChecksJson,
        Integer volumeThresholdPercent
) {
}
