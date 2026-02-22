package com.privod.platform.modules.portal.web.dto;

import com.privod.platform.modules.portal.domain.PortalKs2Draft;
import com.privod.platform.modules.portal.domain.PortalKs2DraftStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record PortalKs2DraftResponse(
        UUID id,
        UUID organizationId,
        UUID portalUserId,
        UUID projectId,
        UUID contractId,
        String draftNumber,
        LocalDate reportingPeriodStart,
        LocalDate reportingPeriodEnd,
        BigDecimal totalAmount,
        String workDescription,
        String linesJson,
        PortalKs2DraftStatus status,
        String statusDisplayName,
        Instant submittedAt,
        String reviewComment,
        UUID reviewedBy,
        Instant reviewedAt,
        UUID linkedKs2Id,
        Instant createdAt,
        Instant updatedAt
) {
    public static PortalKs2DraftResponse fromEntity(PortalKs2Draft draft) {
        return new PortalKs2DraftResponse(
                draft.getId(),
                draft.getOrganizationId(),
                draft.getPortalUserId(),
                draft.getProjectId(),
                draft.getContractId(),
                draft.getDraftNumber(),
                draft.getReportingPeriodStart(),
                draft.getReportingPeriodEnd(),
                draft.getTotalAmount(),
                draft.getWorkDescription(),
                draft.getLinesJson(),
                draft.getStatus(),
                draft.getStatus().getDisplayName(),
                draft.getSubmittedAt(),
                draft.getReviewComment(),
                draft.getReviewedBy(),
                draft.getReviewedAt(),
                draft.getLinkedKs2Id(),
                draft.getCreatedAt(),
                draft.getUpdatedAt()
        );
    }
}
