package com.privod.platform.modules.integration.pricing.web.dto;

public record QuarterlyIndexImportResponse(
        String quarter,
        int totalEntries,
        int importedEntries,
        int duplicateEntries,
        int skippedEntries
) {
}
