package com.privod.platform.modules.bidManagement.web.dto;

import com.privod.platform.modules.bidManagement.domain.BidInvitation;
import com.privod.platform.modules.bidManagement.domain.BidInvitationStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

public record BidInvitationResponse(
        UUID id,
        UUID bidPackageId,
        UUID vendorId,
        String vendorName,
        String vendorEmail,
        BidInvitationStatus status,
        LocalDateTime invitedAt,
        LocalDateTime respondedAt,
        BigDecimal bidAmount,
        String bidNotes,
        Integer attachmentsCount,
        Instant createdAt
) {
    public static BidInvitationResponse fromEntity(BidInvitation entity) {
        return new BidInvitationResponse(
                entity.getId(),
                entity.getBidPackageId(),
                entity.getVendorId(),
                entity.getVendorName(),
                entity.getVendorEmail(),
                entity.getStatus(),
                entity.getInvitedAt(),
                entity.getRespondedAt(),
                entity.getBidAmount(),
                entity.getBidNotes(),
                entity.getAttachmentsCount(),
                entity.getCreatedAt()
        );
    }
}
