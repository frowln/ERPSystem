package com.privod.platform.modules.closeout.web.dto;

import com.privod.platform.modules.closeout.domain.CommissioningSignOff;

import java.time.Instant;
import java.util.UUID;

public record CommissioningSignOffResponse(
        UUID id,
        UUID checklistId,
        String signerName,
        String signerRole,
        String signerOrganization,
        String decision,
        String decisionDisplayName,
        String comments,
        Instant signedAt,
        Instant createdAt
) {
    public static CommissioningSignOffResponse fromEntity(CommissioningSignOff entity) {
        return new CommissioningSignOffResponse(
                entity.getId(),
                entity.getChecklistId(),
                entity.getSignerName(),
                entity.getSignerRole(),
                entity.getSignerOrganization(),
                entity.getDecision().name(),
                entity.getDecision().getDisplayName(),
                entity.getComments(),
                entity.getSignedAt(),
                entity.getCreatedAt()
        );
    }
}
