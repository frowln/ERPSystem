package com.privod.platform.modules.task.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.task.domain.Milestone;
import com.privod.platform.modules.task.domain.MilestoneStatus;
import com.privod.platform.modules.task.repository.MilestoneRepository;
import com.privod.platform.modules.task.web.dto.CreateMilestoneRequest;
import com.privod.platform.modules.task.web.dto.MilestoneResponse;
import com.privod.platform.modules.task.web.dto.UpdateMilestoneRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class MilestoneService {

    private final MilestoneRepository milestoneRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<MilestoneResponse> listAll(Pageable pageable) {
        return milestoneRepository.findByDeletedFalse(pageable)
                .map(MilestoneResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public MilestoneResponse getMilestone(UUID id) {
        Milestone milestone = getMilestoneOrThrow(id);
        return MilestoneResponse.fromEntity(milestone);
    }

    @Transactional
    public MilestoneResponse createMilestone(CreateMilestoneRequest request) {
        Milestone milestone = Milestone.builder()
                .name(request.name())
                .projectId(request.projectId())
                .dueDate(request.dueDate())
                .status(MilestoneStatus.PENDING)
                .description(request.description())
                .build();

        milestone = milestoneRepository.save(milestone);
        auditService.logCreate("Milestone", milestone.getId());

        log.info("Milestone created: {} ({})", milestone.getName(), milestone.getId());
        return MilestoneResponse.fromEntity(milestone);
    }

    @Transactional
    public MilestoneResponse updateMilestone(UUID id, UpdateMilestoneRequest request) {
        Milestone milestone = getMilestoneOrThrow(id);

        if (request.name() != null) {
            milestone.setName(request.name());
        }
        if (request.projectId() != null) {
            milestone.setProjectId(request.projectId());
        }
        if (request.dueDate() != null) {
            milestone.setDueDate(request.dueDate());
        }
        if (request.description() != null) {
            milestone.setDescription(request.description());
        }
        if (request.progress() != null) {
            milestone.setProgress(request.progress());
        }

        milestone = milestoneRepository.save(milestone);
        auditService.logUpdate("Milestone", milestone.getId(), "multiple", null, null);

        log.info("Milestone updated: {} ({})", milestone.getName(), milestone.getId());
        return MilestoneResponse.fromEntity(milestone);
    }

    @Transactional
    public MilestoneResponse completeMilestone(UUID id) {
        Milestone milestone = getMilestoneOrThrow(id);

        if (milestone.getStatus() != MilestoneStatus.PENDING && milestone.getStatus() != MilestoneStatus.OVERDUE) {
            throw new IllegalStateException(
                    "Завершить можно только веху в статусе Ожидает или Просрочен");
        }

        MilestoneStatus oldStatus = milestone.getStatus();
        milestone.setStatus(MilestoneStatus.COMPLETED);
        milestone.setCompletedDate(LocalDate.now());
        milestone.setProgress(100);

        milestone = milestoneRepository.save(milestone);
        auditService.logStatusChange("Milestone", milestone.getId(), oldStatus.name(), MilestoneStatus.COMPLETED.name());

        log.info("Milestone completed: {} ({})", milestone.getName(), milestone.getId());
        return MilestoneResponse.fromEntity(milestone);
    }

    @Transactional(readOnly = true)
    public List<MilestoneResponse> getProjectMilestones(UUID projectId) {
        return milestoneRepository.findByProjectIdAndDeletedFalseOrderByDueDateAsc(projectId)
                .stream()
                .map(MilestoneResponse::fromEntity)
                .toList();
    }

    private Milestone getMilestoneOrThrow(UUID id) {
        return milestoneRepository.findById(id)
                .filter(m -> !m.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Веха не найдена: " + id));
    }
}
