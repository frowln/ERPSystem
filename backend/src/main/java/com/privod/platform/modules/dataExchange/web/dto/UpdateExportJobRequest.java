package com.privod.platform.modules.dataExchange.web.dto;

public record UpdateExportJobRequest(
        String status,
        Integer totalRows,
        String fileUrl
) {
}
