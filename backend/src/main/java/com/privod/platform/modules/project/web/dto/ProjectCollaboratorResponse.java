package com.privod.platform.modules.project.web.dto;

import com.privod.platform.modules.project.domain.ProjectCollaborator;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

public record ProjectCollaboratorResponse(
        UUID id,
        UUID projectId,
        UUID partnerId,
        String role,
        LocalDateTime invitedAt,
        LocalDateTime acceptedAt,
        boolean accepted,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static ProjectCollaboratorResponse fromEntity(ProjectCollaborator collaborator) {
        return new ProjectCollaboratorResponse(
                collaborator.getId(),
                collaborator.getProjectId(),
                collaborator.getPartnerId(),
                collaborator.getRole(),
                collaborator.getInvitedAt(),
                collaborator.getAcceptedAt(),
                collaborator.isAccepted(),
                collaborator.getCreatedAt(),
                collaborator.getUpdatedAt(),
                collaborator.getCreatedBy()
        );
    }
}
