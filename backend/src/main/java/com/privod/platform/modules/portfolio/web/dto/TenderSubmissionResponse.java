package com.privod.platform.modules.portfolio.web.dto;

import com.privod.platform.modules.portfolio.domain.TenderSubmission;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record TenderSubmissionResponse(
        UUID id,
        UUID bidPackageId,
        Integer submissionVersion,
        String technicalProposal,
        String commercialSummary,
        BigDecimal totalPrice,
        BigDecimal discountPercent,
        BigDecimal finalPrice,
        UUID submittedById,
        Instant submittedAt,
        String attachmentIds,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static TenderSubmissionResponse fromEntity(TenderSubmission ts) {
        return new TenderSubmissionResponse(
                ts.getId(),
                ts.getBidPackageId(),
                ts.getSubmissionVersion(),
                ts.getTechnicalProposal(),
                ts.getCommercialSummary(),
                ts.getTotalPrice(),
                ts.getDiscountPercent(),
                ts.getFinalPrice(),
                ts.getSubmittedById(),
                ts.getSubmittedAt(),
                ts.getAttachmentIds(),
                ts.getCreatedAt(),
                ts.getUpdatedAt(),
                ts.getCreatedBy()
        );
    }
}
