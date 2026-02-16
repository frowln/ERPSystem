package com.privod.platform.modules.project.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.project.domain.ProjectCollaborator;
import com.privod.platform.modules.project.repository.ProjectCollaboratorRepository;
import com.privod.platform.modules.project.web.dto.CreateProjectCollaboratorRequest;
import com.privod.platform.modules.project.web.dto.ProjectCollaboratorResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectCollaboratorService {

    private final ProjectCollaboratorRepository collaboratorRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public List<ProjectCollaboratorResponse> getProjectCollaborators(UUID projectId) {
        return collaboratorRepository.findByProjectIdAndDeletedFalse(projectId)
                .stream()
                .map(ProjectCollaboratorResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ProjectCollaboratorResponse> getPartnerProjects(UUID partnerId) {
        return collaboratorRepository.findByPartnerIdAndDeletedFalse(partnerId)
                .stream()
                .map(ProjectCollaboratorResponse::fromEntity)
                .toList();
    }

    @Transactional
    public ProjectCollaboratorResponse addCollaborator(UUID projectId, CreateProjectCollaboratorRequest request) {
        if (collaboratorRepository.existsByProjectIdAndPartnerIdAndDeletedFalse(projectId, request.partnerId())) {
            throw new IllegalStateException("Партнёр уже является участником проекта");
        }

        ProjectCollaborator collaborator = ProjectCollaborator.builder()
                .projectId(projectId)
                .partnerId(request.partnerId())
                .role(request.role())
                .invitedAt(LocalDateTime.now())
                .build();

        collaborator = collaboratorRepository.save(collaborator);
        auditService.logCreate("ProjectCollaborator", collaborator.getId());

        log.info("Collaborator added to project {}: partner={} role={} ({})",
                projectId, request.partnerId(), request.role(), collaborator.getId());
        return ProjectCollaboratorResponse.fromEntity(collaborator);
    }

    @Transactional
    public ProjectCollaboratorResponse acceptInvitation(UUID collaboratorId) {
        ProjectCollaborator collaborator = getCollaboratorOrThrow(collaboratorId);

        if (collaborator.isAccepted()) {
            throw new IllegalStateException("Приглашение уже принято");
        }

        collaborator.setAcceptedAt(LocalDateTime.now());
        collaborator = collaboratorRepository.save(collaborator);
        auditService.logUpdate("ProjectCollaborator", collaborator.getId(), "acceptedAt", null,
                collaborator.getAcceptedAt().toString());

        log.info("Collaborator accepted invitation: {} ({})", collaborator.getPartnerId(), collaborator.getId());
        return ProjectCollaboratorResponse.fromEntity(collaborator);
    }

    @Transactional
    public void removeCollaborator(UUID collaboratorId) {
        ProjectCollaborator collaborator = getCollaboratorOrThrow(collaboratorId);
        collaborator.softDelete();
        collaboratorRepository.save(collaborator);
        auditService.logDelete("ProjectCollaborator", collaboratorId);
        log.info("Collaborator removed: {} ({})", collaborator.getPartnerId(), collaboratorId);
    }

    private ProjectCollaborator getCollaboratorOrThrow(UUID id) {
        return collaboratorRepository.findById(id)
                .filter(c -> !c.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Участник проекта не найден: " + id));
    }
}
