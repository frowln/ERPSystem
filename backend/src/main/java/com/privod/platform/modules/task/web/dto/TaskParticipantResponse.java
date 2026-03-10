package com.privod.platform.modules.task.web.dto;

import com.privod.platform.modules.task.domain.ParticipantRole;
import com.privod.platform.modules.task.domain.TaskParticipant;

import java.time.Instant;
import java.util.UUID;

public record TaskParticipantResponse(
        UUID id,
        UUID taskId,
        UUID userId,
        String userName,
        ParticipantRole role,
        String roleDisplayName,
        Instant addedAt,
        UUID addedById,
        String addedByName
) {
    public static TaskParticipantResponse fromEntity(TaskParticipant p) {
        return new TaskParticipantResponse(
                p.getId(),
                p.getTaskId(),
                p.getUserId(),
                p.getUserName(),
                p.getRole(),
                p.getRole().getDisplayName(),
                p.getAddedAt(),
                p.getAddedById(),
                p.getAddedByName()
        );
    }
}
