package com.privod.platform.modules.closing.web.dto;

import java.math.BigDecimal;
import java.util.List;

public record PipelinePreviewResponse(
        List<VolumeEntry> volumes,
        BigDecimal estimatedTotal,
        int lineCount,
        String contractNumber,
        String projectName
) {
}
