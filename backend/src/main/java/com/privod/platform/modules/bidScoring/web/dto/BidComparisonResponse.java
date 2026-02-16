package com.privod.platform.modules.bidScoring.web.dto;

import com.privod.platform.modules.bidScoring.domain.BidComparison;
import com.privod.platform.modules.bidScoring.domain.ComparisonStatus;

import java.time.Instant;
import java.util.UUID;

public record BidComparisonResponse(
        UUID id,
        UUID projectId,
        String title,
        String description,
        ComparisonStatus status,
        String statusDisplayName,
        String rfqNumber,
        String category,
        UUID createdById,
        UUID approvedById,
        Instant approvedAt,
        UUID winnerVendorId,
        String winnerJustification,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static BidComparisonResponse fromEntity(BidComparison bc) {
        return new BidComparisonResponse(
                bc.getId(),
                bc.getProjectId(),
                bc.getTitle(),
                bc.getDescription(),
                bc.getStatus(),
                bc.getStatus().getDisplayName(),
                bc.getRfqNumber(),
                bc.getCategory(),
                bc.getCreatedById(),
                bc.getApprovedById(),
                bc.getApprovedAt(),
                bc.getWinnerVendorId(),
                bc.getWinnerJustification(),
                bc.getCreatedAt(),
                bc.getUpdatedAt(),
                bc.getCreatedBy()
        );
    }
}
