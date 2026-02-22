package com.privod.platform.modules.portal.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.portal.domain.PortalTask;
import com.privod.platform.modules.portal.domain.PortalTaskPriority;
import com.privod.platform.modules.portal.domain.PortalTaskStatus;
import com.privod.platform.modules.portal.repository.PortalTaskRepository;
import com.privod.platform.modules.portal.web.dto.CreatePortalTaskRequest;
import com.privod.platform.modules.portal.web.dto.PortalTaskResponse;
import com.privod.platform.modules.portal.web.dto.UpdatePortalTaskStatusRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PortalTaskService {

    private final PortalTaskRepository portalTaskRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<PortalTaskResponse> getMyTasks(UUID portalUserId, PortalTaskStatus status, Pageable pageable) {
        if (status != null) {
            return portalTaskRepository.findByPortalUserIdAndStatusAndDeletedFalse(portalUserId, status, pageable)
                    .map(PortalTaskResponse::fromEntity);
        }
        return portalTaskRepository.findByPortalUserIdAndDeletedFalse(portalUserId, pageable)
                .map(PortalTaskResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public Page<PortalTaskResponse> getProjectTasks(UUID projectId, Pageable pageable) {
        return portalTaskRepository.findByProjectIdAndDeletedFalse(projectId, pageable)
                .map(PortalTaskResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public PortalTaskResponse getById(UUID id) {
        PortalTask task = findTaskOrThrow(id);
        return PortalTaskResponse.fromEntity(task);
    }

    @Transactional
    public PortalTaskResponse create(CreatePortalTaskRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        UUID assignedById = SecurityUtils.requireCurrentUserId();

        PortalTask task = PortalTask.builder()
                .organizationId(orgId)
                .portalUserId(request.portalUserId())
                .projectId(request.projectId())
                .title(request.title())
                .description(request.description())
                .priority(request.priority() != null ? request.priority() : PortalTaskPriority.MEDIUM)
                .dueDate(request.dueDate())
                .assignedById(assignedById)
                .status(PortalTaskStatus.PENDING)
                .build();

        task = portalTaskRepository.save(task);
        auditService.logCreate("PortalTask", task.getId());
        log.info("Portal task created: id={}, portalUser={}, assignedBy={}",
                task.getId(), request.portalUserId(), assignedById);
        return PortalTaskResponse.fromEntity(task);
    }

    @Transactional
    public PortalTaskResponse updateStatus(UUID id, UpdatePortalTaskStatusRequest request, UUID portalUserId) {
        PortalTask task = findTaskOrThrow(id);

        if (portalUserId != null && !task.getPortalUserId().equals(portalUserId)) {
            throw new IllegalStateException("Только назначенный пользователь может обновить статус задачи");
        }

        String oldStatus = task.getStatus().name();
        task.setStatus(request.status());

        if (request.completionNote() != null) {
            task.setCompletionNote(request.completionNote());
        }

        if (request.status() == PortalTaskStatus.COMPLETED) {
            task.setCompletedAt(Instant.now());
        }

        task = portalTaskRepository.save(task);
        auditService.logStatusChange("PortalTask", task.getId(), oldStatus, task.getStatus().name());
        log.info("Portal task status updated: id={}, {} -> {}", id, oldStatus, request.status());
        return PortalTaskResponse.fromEntity(task);
    }

    @Transactional
    public void delete(UUID id) {
        PortalTask task = findTaskOrThrow(id);
        task.softDelete();
        portalTaskRepository.save(task);
        auditService.logDelete("PortalTask", task.getId());
        log.info("Portal task deleted: id={}", id);
    }

    private PortalTask findTaskOrThrow(UUID id) {
        return portalTaskRepository.findById(id)
                .filter(t -> !t.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Задача портала не найдена: " + id));
    }
}
