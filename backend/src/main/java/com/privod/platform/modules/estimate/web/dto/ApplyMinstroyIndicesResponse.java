package com.privod.platform.modules.estimate.web.dto;

import java.util.List;
import java.util.UUID;

public record ApplyMinstroyIndicesResponse(
        UUID estimateId,
        int appliedIndices,
        List<ItemResult> items
) {
    public record ItemResult(
            String name,
            double oldPrice,
            double newPrice,
            double indexApplied
    ) {
    }
}
