package com.privod.platform.modules.safety.web.dto;

import com.privod.platform.modules.safety.domain.SafetyTraining;
import com.privod.platform.modules.safety.domain.TrainingStatus;
import com.privod.platform.modules.safety.domain.TrainingType;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record SafetyTrainingResponse(
        UUID id,
        String title,
        TrainingType trainingType,
        String trainingTypeDisplayName,
        UUID projectId,
        LocalDate date,
        UUID instructorId,
        String instructorName,
        String participants,
        String topics,
        Integer duration,
        TrainingStatus status,
        String statusDisplayName,
        String notes,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static SafetyTrainingResponse fromEntity(SafetyTraining entity) {
        return new SafetyTrainingResponse(
                entity.getId(),
                entity.getTitle(),
                entity.getTrainingType(),
                entity.getTrainingType().getDisplayName(),
                entity.getProjectId(),
                entity.getDate(),
                entity.getInstructorId(),
                entity.getInstructorName(),
                entity.getParticipants(),
                entity.getTopics(),
                entity.getDuration(),
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getNotes(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
