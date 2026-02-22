package com.privod.platform.modules.bim.web.dto;

import com.privod.platform.modules.bim.domain.BimClashResult;
import com.privod.platform.modules.bim.domain.ClashResultStatus;
import com.privod.platform.modules.bim.domain.ClashType;

import java.time.Instant;
import java.util.UUID;

public record ClashResultResponse(
        UUID id,
        UUID clashTestId,
        String elementAGuid,
        String elementAName,
        String elementAType,
        String elementBGuid,
        String elementBName,
        String elementBType,
        ClashType clashType,
        String clashTypeDisplayName,
        Double clashPointX,
        Double clashPointY,
        Double clashPointZ,
        Double distanceMm,
        ClashResultStatus status,
        String statusDisplayName,
        UUID assignedToUserId,
        Instant resolvedAt,
        String resolutionNotes,
        Instant createdAt,
        Instant updatedAt
) {
    public static ClashResultResponse fromEntity(BimClashResult entity) {
        return new ClashResultResponse(
                entity.getId(),
                entity.getClashTestId(),
                entity.getElementAGuid(),
                entity.getElementAName(),
                entity.getElementAType(),
                entity.getElementBGuid(),
                entity.getElementBName(),
                entity.getElementBType(),
                entity.getClashType(),
                entity.getClashType().getDisplayName(),
                entity.getClashPointX(),
                entity.getClashPointY(),
                entity.getClashPointZ(),
                entity.getDistanceMm(),
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getAssignedToUserId(),
                entity.getResolvedAt(),
                entity.getResolutionNotes(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
