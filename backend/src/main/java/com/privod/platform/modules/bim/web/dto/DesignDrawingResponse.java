package com.privod.platform.modules.bim.web.dto;

import com.privod.platform.modules.bim.domain.DesignDiscipline;
import com.privod.platform.modules.bim.domain.DesignDrawing;
import com.privod.platform.modules.bim.domain.DrawingStatus;

import java.time.Instant;
import java.util.UUID;

public record DesignDrawingResponse(
        UUID id,
        UUID packageId,
        String number,
        String title,
        String revision,
        String scale,
        String format,
        String fileUrl,
        DrawingStatus status,
        String statusDisplayName,
        DesignDiscipline discipline,
        String disciplineDisplayName,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static DesignDrawingResponse fromEntity(DesignDrawing entity) {
        return new DesignDrawingResponse(
                entity.getId(),
                entity.getPackageId(),
                entity.getNumber(),
                entity.getTitle(),
                entity.getRevision(),
                entity.getScale(),
                entity.getFormat(),
                entity.getFileUrl(),
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getDiscipline(),
                entity.getDiscipline().getDisplayName(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
