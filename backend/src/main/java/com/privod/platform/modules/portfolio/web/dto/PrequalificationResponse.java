package com.privod.platform.modules.portfolio.web.dto;

import com.privod.platform.modules.portfolio.domain.Prequalification;
import com.privod.platform.modules.portfolio.domain.PrequalificationStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record PrequalificationResponse(
        UUID id,
        UUID organizationId,
        String clientName,
        String projectName,
        PrequalificationStatus status,
        String statusDisplayName,
        LocalDate submissionDate,
        LocalDate expiryDate,
        String categories,
        BigDecimal maxContractValue,
        UUID responsibleId,
        String documents,
        String notes,
        boolean expired,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static PrequalificationResponse fromEntity(Prequalification pq) {
        return new PrequalificationResponse(
                pq.getId(),
                pq.getOrganizationId(),
                pq.getClientName(),
                pq.getProjectName(),
                pq.getStatus(),
                pq.getStatus().getDisplayName(),
                pq.getSubmissionDate(),
                pq.getExpiryDate(),
                pq.getCategories(),
                pq.getMaxContractValue(),
                pq.getResponsibleId(),
                pq.getDocuments(),
                pq.getNotes(),
                pq.isExpired(),
                pq.getCreatedAt(),
                pq.getUpdatedAt(),
                pq.getCreatedBy()
        );
    }
}
