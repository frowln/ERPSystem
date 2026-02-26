package com.privod.platform.modules.integration.pricing.web.dto;

import java.util.List;
import java.util.UUID;

public record PricingImportReportResponse(
        UUID databaseId,
        String source,
        int totalRows,
        int importedRows,
        int duplicateRows,
        int skippedRows,
        int errorRows,
        List<String> errors
) {
}
