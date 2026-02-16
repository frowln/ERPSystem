package com.privod.platform.modules.kep.web.dto;

import com.privod.platform.modules.kep.domain.KepPriority;
import com.privod.platform.modules.kep.domain.KepSigningRequest;
import com.privod.platform.modules.kep.domain.KepSigningStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record KepSigningRequestResponse(
        UUID id,
        String documentModel,
        UUID documentId,
        String documentTitle,
        UUID requesterId,
        UUID signerId,
        KepSigningStatus status,
        String statusDisplayName,
        LocalDate dueDate,
        LocalDateTime signedAt,
        String rejectionReason,
        KepPriority priority,
        String priorityDisplayName,
        boolean overdue,
        Instant createdAt,
        Instant updatedAt
) {
    public static KepSigningRequestResponse fromEntity(KepSigningRequest req) {
        return new KepSigningRequestResponse(
                req.getId(),
                req.getDocumentModel(),
                req.getDocumentId(),
                req.getDocumentTitle(),
                req.getRequesterId(),
                req.getSignerId(),
                req.getStatus(),
                req.getStatus().getDisplayName(),
                req.getDueDate(),
                req.getSignedAt(),
                req.getRejectionReason(),
                req.getPriority(),
                req.getPriority().getDisplayName(),
                req.isOverdue(),
                req.getCreatedAt(),
                req.getUpdatedAt()
        );
    }
}
