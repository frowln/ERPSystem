package com.privod.platform.modules.ai.web.dto;

import com.privod.platform.modules.ai.domain.AnalysisType;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreateDocumentAnalysisRequest(
        @NotNull(message = "Document ID is required")
        UUID documentId,

        @NotNull(message = "Analysis type is required")
        AnalysisType analysisType
) {
}
