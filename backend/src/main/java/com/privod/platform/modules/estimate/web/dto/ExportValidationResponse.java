package com.privod.platform.modules.estimate.web.dto;

import java.util.List;

public record ExportValidationResponse(
        boolean valid,
        List<ValidationIssue> errors,
        List<ValidationIssue> warnings
) {
    public record ValidationIssue(
            String field,
            String message
    ) {}
}
