package com.privod.platform.modules.estimate.web.dto;

public record ExportConfigRequest(
        boolean includeSummary,
        boolean includeDetails,
        String formatVersion
) {}
