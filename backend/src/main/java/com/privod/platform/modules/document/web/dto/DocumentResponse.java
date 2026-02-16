package com.privod.platform.modules.document.web.dto;

import com.privod.platform.modules.document.domain.Document;
import com.privod.platform.modules.document.domain.DocumentCategory;
import com.privod.platform.modules.document.domain.DocumentStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record DocumentResponse(
        UUID id,
        String title,
        String documentNumber,
        DocumentCategory category,
        String categoryDisplayName,
        DocumentStatus status,
        String statusDisplayName,
        UUID projectId,
        UUID contractId,
        String description,
        String fileName,
        Long fileSize,
        String mimeType,
        String storagePath,
        Integer docVersion,
        UUID parentVersionId,
        UUID authorId,
        String authorName,
        String tags,
        LocalDate expiryDate,
        String notes,
        List<DocumentAccessResponse> accessList,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static DocumentResponse fromEntity(Document document) {
        return fromEntity(document, null);
    }

    public static DocumentResponse fromEntity(Document document, List<DocumentAccessResponse> accessList) {
        return new DocumentResponse(
                document.getId(),
                document.getTitle(),
                document.getDocumentNumber(),
                document.getCategory(),
                document.getCategory() != null ? document.getCategory().getDisplayName() : null,
                document.getStatus(),
                document.getStatus().getDisplayName(),
                document.getProjectId(),
                document.getContractId(),
                document.getDescription(),
                document.getFileName(),
                document.getFileSize(),
                document.getMimeType(),
                document.getStoragePath(),
                document.getDocVersion(),
                document.getParentVersionId(),
                document.getAuthorId(),
                document.getAuthorName(),
                document.getTags(),
                document.getExpiryDate(),
                document.getNotes(),
                accessList,
                document.getCreatedAt(),
                document.getUpdatedAt(),
                document.getCreatedBy()
        );
    }
}
