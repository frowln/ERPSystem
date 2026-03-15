package com.privod.platform.modules.warehouse.web.dto;

import java.util.List;

public record BulkImportMaterialResponse(
        int totalReceived,
        int successCount,
        int errorCount,
        List<MaterialResponse> created,
        List<BulkImportError> errors
) {
    public record BulkImportError(
            int rowIndex,
            String name,
            String error
    ) {
    }
}
