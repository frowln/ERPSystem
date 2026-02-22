package com.privod.platform.modules.compliance.web.dto;

import com.privod.platform.modules.compliance.domain.DataSubjectRequest;
import com.privod.platform.modules.compliance.domain.SubjectRequestStatus;
import com.privod.platform.modules.compliance.domain.SubjectRequestType;

import java.time.Instant;
import java.util.UUID;

public record DataSubjectRequestResponse(
        UUID id,
        UUID organizationId,
        UUID userId,
        SubjectRequestType requestType,
        SubjectRequestStatus status,
        String description,
        String responseText,
        Instant completedAt,
        Instant deadlineAt,
        UUID processedBy,
        Instant createdAt,
        Instant updatedAt
) {
    public static DataSubjectRequestResponse fromEntity(DataSubjectRequest entity) {
        return new DataSubjectRequestResponse(
                entity.getId(),
                entity.getOrganizationId(),
                entity.getUserId(),
                entity.getRequestType(),
                entity.getStatus(),
                entity.getDescription(),
                entity.getResponseText(),
                entity.getCompletedAt(),
                entity.getDeadlineAt(),
                entity.getProcessedBy(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
