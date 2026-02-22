package com.privod.platform.modules.closeout.web.dto;

import com.privod.platform.modules.closeout.domain.DocumentCategory;

import java.math.BigDecimal;
import java.util.List;

public record CompletenessReportResponse(
        BigDecimal completenessPct,
        int totalRequired,
        int totalPresent,
        int totalMissing,
        List<MissingDocumentItem> missingItems
) {

    public record MissingDocumentItem(
            DocumentCategory category,
            String documentType,
            String wbsNodeName,
            String description
    ) {
    }
}
