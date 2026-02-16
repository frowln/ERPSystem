package com.privod.platform.modules.portfolio.web.dto;

import com.privod.platform.modules.portfolio.domain.BidPackage;
import com.privod.platform.modules.portfolio.domain.BidStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

public record BidPackageResponse(
        UUID id,
        UUID opportunityId,
        String projectName,
        BidStatus status,
        String statusDisplayName,
        String bidNumber,
        String clientOrganization,
        LocalDateTime submissionDeadline,
        LocalDateTime submissionDate,
        BigDecimal bidAmount,
        BigDecimal estimatedCost,
        BigDecimal estimatedMargin,
        UUID bidManagerId,
        UUID technicalLeadId,
        Boolean bondRequired,
        BigDecimal bondAmount,
        String documents,
        String competitorInfo,
        String notes,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static BidPackageResponse fromEntity(BidPackage bp) {
        return new BidPackageResponse(
                bp.getId(),
                bp.getOpportunityId(),
                bp.getProjectName(),
                bp.getStatus(),
                bp.getStatus().getDisplayName(),
                bp.getBidNumber(),
                bp.getClientOrganization(),
                bp.getSubmissionDeadline(),
                bp.getSubmissionDate(),
                bp.getBidAmount(),
                bp.getEstimatedCost(),
                bp.getEstimatedMargin(),
                bp.getBidManagerId(),
                bp.getTechnicalLeadId(),
                bp.getBondRequired(),
                bp.getBondAmount(),
                bp.getDocuments(),
                bp.getCompetitorInfo(),
                bp.getNotes(),
                bp.getCreatedAt(),
                bp.getUpdatedAt(),
                bp.getCreatedBy()
        );
    }
}
