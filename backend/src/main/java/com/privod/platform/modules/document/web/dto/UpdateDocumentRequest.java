package com.privod.platform.modules.document.web.dto;

import com.privod.platform.modules.document.domain.DocumentCategory;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record UpdateDocumentRequest(
        @Size(max = 500, message = "Название не должно превышать 500 символов")
        String title,

        @Size(max = 200)
        String documentNumber,

        DocumentCategory category,

        UUID projectId,

        UUID contractId,

        String description,

        @Size(max = 500)
        String fileName,

        Long fileSize,

        @Size(max = 200)
        String mimeType,

        @Size(max = 1000)
        String storagePath,

        @Size(max = 500)
        String tags,

        LocalDate expiryDate,

        String notes
) {
}
