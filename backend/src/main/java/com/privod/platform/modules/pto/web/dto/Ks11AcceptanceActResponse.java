package com.privod.platform.modules.pto.web.dto;

import com.privod.platform.modules.pto.domain.Ks11AcceptanceAct;
import com.privod.platform.modules.pto.domain.Ks11Status;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record Ks11AcceptanceActResponse(
        UUID id,
        UUID projectId,
        LocalDate date,
        String commissionMembers,
        String decision,
        String defects,
        String notes,
        Ks11Status status,
        String statusDisplayName,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static Ks11AcceptanceActResponse fromEntity(Ks11AcceptanceAct entity) {
        return new Ks11AcceptanceActResponse(
                entity.getId(),
                entity.getProjectId(),
                entity.getDate(),
                entity.getCommissionMembers(),
                entity.getDecision(),
                entity.getDefects(),
                entity.getNotes(),
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
