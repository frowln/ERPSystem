package com.privod.platform.modules.design.web.dto;

import com.privod.platform.modules.design.domain.DesignVersion;
import com.privod.platform.modules.design.domain.DesignVersionStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record DesignVersionResponse(
        UUID id,
        UUID projectId,
        UUID documentId,
        String versionNumber,
        String title,
        String discipline,
        String author,
        DesignVersionStatus status,
        String statusDisplayName,
        LocalDate reviewDeadline,
        String fileUrl,
        Long fileSize,
        String changeDescription,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static DesignVersionResponse fromEntity(DesignVersion dv) {
        return new DesignVersionResponse(
                dv.getId(),
                dv.getProjectId(),
                dv.getDocumentId(),
                dv.getVersionNumber(),
                dv.getTitle(),
                dv.getDiscipline(),
                dv.getAuthor(),
                dv.getStatus(),
                dv.getStatus().getDisplayName(),
                dv.getReviewDeadline(),
                dv.getFileUrl(),
                dv.getFileSize(),
                dv.getChangeDescription(),
                dv.getCreatedAt(),
                dv.getUpdatedAt(),
                dv.getCreatedBy()
        );
    }
}
