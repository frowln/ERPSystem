package com.privod.platform.modules.closeout.web.dto;

import com.privod.platform.modules.closeout.domain.DocumentCategory;
import com.privod.platform.modules.closeout.domain.PackageDocumentStatus;
import com.privod.platform.modules.closeout.domain.StroynadzorPackageDocument;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record StroynadzorPackageDocumentResponse(
        UUID id,
        UUID packageId,
        DocumentCategory documentCategory,
        String documentCategoryDisplayName,
        String documentType,
        UUID documentId,
        String documentNumber,
        LocalDate documentDate,
        String sectionNumber,
        Integer pageNumber,
        boolean hasSignature,
        PackageDocumentStatus status,
        String statusDisplayName,
        String notes,
        Instant createdAt
) {
    public static StroynadzorPackageDocumentResponse fromEntity(StroynadzorPackageDocument entity) {
        return new StroynadzorPackageDocumentResponse(
                entity.getId(),
                entity.getPackageId(),
                entity.getDocumentCategory(),
                entity.getDocumentCategory().getDisplayName(),
                entity.getDocumentType(),
                entity.getDocumentId(),
                entity.getDocumentNumber(),
                entity.getDocumentDate(),
                entity.getSectionNumber(),
                entity.getPageNumber(),
                entity.isHasSignature(),
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getNotes(),
                entity.getCreatedAt()
        );
    }
}
