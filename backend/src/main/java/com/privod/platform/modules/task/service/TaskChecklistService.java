package com.privod.platform.modules.task.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.task.domain.TaskChecklist;
import com.privod.platform.modules.task.repository.TaskChecklistRepository;
import com.privod.platform.modules.task.web.dto.CreateChecklistItemRequest;
import com.privod.platform.modules.task.web.dto.TaskChecklistResponse;
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
public class TaskChecklistService {

    private final TaskChecklistRepository checklistRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public List<TaskChecklistResponse> getChecklistItems(UUID taskId) {
        return checklistRepository.findByTaskIdAndDeletedFalseOrderBySortOrderAsc(taskId)
                .stream()
                .map(TaskChecklistResponse::fromEntity)
                .toList();
    }

    @Transactional
    public TaskChecklistResponse addChecklistItem(UUID taskId, CreateChecklistItemRequest request) {
        TaskChecklist item = TaskChecklist.builder()
                .taskId(taskId)
                .title(request.title())
                .sortOrder(request.sortOrder() != null ? request.sortOrder() : 0)
                .isCompleted(false)
                .build();

        item = checklistRepository.save(item);
        auditService.logCreate("TaskChecklist", item.getId());

        log.info("Checklist item added to task {}: {} ({})", taskId, item.getTitle(), item.getId());
        return TaskChecklistResponse.fromEntity(item);
    }

    @Transactional
    public TaskChecklistResponse toggleChecklistItem(UUID itemId, UUID completedById) {
        TaskChecklist item = getItemOrThrow(itemId);

        if (item.isCompleted()) {
            item.setCompleted(false);
            item.setCompletedAt(null);
            item.setCompletedById(null);
        } else {
            item.setCompleted(true);
            item.setCompletedAt(LocalDateTime.now());
            item.setCompletedById(completedById);
        }

        item = checklistRepository.save(item);
        auditService.logUpdate("TaskChecklist", item.getId(), "isCompleted", null,
                String.valueOf(item.isCompleted()));

        log.info("Checklist item toggled: {} completed={} ({})", item.getTitle(), item.isCompleted(), item.getId());
        return TaskChecklistResponse.fromEntity(item);
    }

    @Transactional
    public void deleteChecklistItem(UUID itemId) {
        TaskChecklist item = getItemOrThrow(itemId);
        item.softDelete();
        checklistRepository.save(item);
        auditService.logDelete("TaskChecklist", itemId);
        log.info("Checklist item soft-deleted: {} ({})", item.getTitle(), itemId);
    }

    @Transactional(readOnly = true)
    public long getCompletedCount(UUID taskId) {
        return checklistRepository.countCompletedByTaskId(taskId);
    }

    @Transactional(readOnly = true)
    public long getTotalCount(UUID taskId) {
        return checklistRepository.countByTaskId(taskId);
    }

    private TaskChecklist getItemOrThrow(UUID id) {
        return checklistRepository.findById(id)
                .filter(c -> !c.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Пункт чеклиста не найден: " + id));
    }
}
