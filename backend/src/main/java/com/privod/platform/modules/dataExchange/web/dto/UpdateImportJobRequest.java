package com.privod.platform.modules.dataExchange.web.dto;

import com.privod.platform.modules.dataExchange.domain.ImportStatus;

public record UpdateImportJobRequest(
        ImportStatus status,
        Integer totalRows,
        Integer processedRows,
        Integer successRows,
        Integer errorRows,
        String errors
) {
}
