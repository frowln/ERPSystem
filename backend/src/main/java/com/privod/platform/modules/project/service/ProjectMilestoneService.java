package com.privod.platform.modules.project.service;

import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.project.domain.ProjectMilestone;
import com.privod.platform.modules.project.repository.ProjectMilestoneRepository;
import com.privod.platform.modules.project.web.dto.CreateMilestoneRequest;
import com.privod.platform.modules.project.web.dto.MilestoneResponse;
import com.privod.platform.modules.project.web.dto.UpdateMilestoneRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectMilestoneService {

    private final ProjectMilestoneRepository milestoneRepository;

    @Transactional(readOnly = true)
    public List<MilestoneResponse> listMilestones(UUID projectId) {
        return milestoneRepository.findByProjectIdAndDeletedFalseOrderBySequenceAsc(projectId)
                .stream()
                .map(MilestoneResponse::fromEntity)
                .toList();
    }

    @Transactional
    public MilestoneResponse createMilestone(UUID projectId, CreateMilestoneRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        ProjectMilestone milestone = ProjectMilestone.builder()
                .projectId(projectId)
                .organizationId(orgId)
                .name(request.name())
                .plannedDate(request.plannedDate())
                .status(request.status() != null ? request.status() : "PENDING")
                .isKeyMilestone(request.isKeyMilestone() != null ? request.isKeyMilestone() : false)
                .notes(request.notes())
                .sequence(request.sequence() != null ? request.sequence() : 0)
                .build();
        milestone = milestoneRepository.save(milestone);
        log.info("Created milestone '{}' for project {}", milestone.getName(), projectId);
        return MilestoneResponse.fromEntity(milestone);
    }

    @Transactional
    public MilestoneResponse updateMilestone(UUID id, UpdateMilestoneRequest request) {
        ProjectMilestone milestone = milestoneRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Milestone not found: " + id));
        if (request.name() != null) milestone.setName(request.name());
        if (request.plannedDate() != null) milestone.setPlannedDate(request.plannedDate());
        if (request.actualDate() != null) milestone.setActualDate(request.actualDate());
        if (request.status() != null) milestone.setStatus(request.status());
        if (request.isKeyMilestone() != null) milestone.setIsKeyMilestone(request.isKeyMilestone());
        if (request.notes() != null) milestone.setNotes(request.notes());
        if (request.sequence() != null) milestone.setSequence(request.sequence());
        milestone = milestoneRepository.save(milestone);
        log.info("Updated milestone '{}' ({})", milestone.getName(), id);
        return MilestoneResponse.fromEntity(milestone);
    }

    @Transactional
    public void deleteMilestone(UUID id) {
        ProjectMilestone milestone = milestoneRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Milestone not found: " + id));
        milestone.softDelete();
        milestoneRepository.save(milestone);
        log.info("Deleted milestone '{}' ({})", milestone.getName(), id);
    }
}
