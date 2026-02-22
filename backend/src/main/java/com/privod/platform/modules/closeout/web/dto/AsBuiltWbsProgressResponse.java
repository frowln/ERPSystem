package com.privod.platform.modules.closeout.web.dto;

import java.util.List;
import java.util.UUID;

public record AsBuiltWbsProgressResponse(
        UUID wbsNodeId,
        String wbsCode,
        String wbsName,
        int totalRequired,
        int submitted,
        int accepted,
        double completionPercent,
        boolean qualityGatePassed,
        List<AsBuiltWbsLinkResponse> links
) {
}
