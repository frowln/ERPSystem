package com.privod.platform.modules.bim.web.dto;

import com.privod.platform.modules.bim.domain.BimViewerSession;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public record ViewerSessionResponse(
        UUID id,
        UUID userId,
        UUID modelId,
        Instant startedAt,
        Instant endedAt,
        Map<String, Object> cameraPositionJson,
        List<String> selectedElementsJson,
        Instant createdAt
) {
    public static ViewerSessionResponse fromEntity(BimViewerSession entity) {
        return new ViewerSessionResponse(
                entity.getId(),
                entity.getUserId(),
                entity.getModelId(),
                entity.getStartedAt(),
                entity.getEndedAt(),
                entity.getCameraPositionJson(),
                entity.getSelectedElementsJson(),
                entity.getCreatedAt()
        );
    }
}
