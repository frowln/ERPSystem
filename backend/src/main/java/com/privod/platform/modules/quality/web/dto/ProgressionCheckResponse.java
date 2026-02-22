package com.privod.platform.modules.quality.web.dto;

import java.util.List;
import java.util.UUID;

public record ProgressionCheckResponse(
        UUID wbsNodeId,
        boolean allowed,
        int totalGates,
        int passedGates,
        List<String> blockingGateNames
) {
}
