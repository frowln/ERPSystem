package com.privod.platform.modules.russianDoc.web.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record OcrEstimateProcessRequest(
        @NotNull(message = "ID задачи OCR обязателен")
        UUID ocrTaskId,

        String documentType
) {
}
