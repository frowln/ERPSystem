package com.privod.platform.modules.task.web.dto;

import com.privod.platform.modules.task.domain.TaskTimeEntry;
import java.time.Instant;
import java.util.UUID;

public record TaskTimeEntryResponse(
    UUID id,
    UUID taskId,
    UUID userId,
    String userName,
    Instant startedAt,
    Instant stoppedAt,
    Integer durationSeconds,
    String description,
    Boolean isRunning,
    Instant createdAt
) {
    public static TaskTimeEntryResponse fromEntity(TaskTimeEntry entry) {
        return new TaskTimeEntryResponse(
            entry.getId(),
            entry.getTaskId(),
            entry.getUserId(),
            entry.getUserName(),
            entry.getStartedAt(),
            entry.getStoppedAt(),
            entry.getDurationSeconds(),
            entry.getDescription(),
            entry.getIsRunning(),
            entry.getCreatedAt()
        );
    }
}
