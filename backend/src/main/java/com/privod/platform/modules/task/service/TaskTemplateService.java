package com.privod.platform.modules.task.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.task.domain.TaskPriority;
import com.privod.platform.modules.task.domain.TaskTemplate;
import com.privod.platform.modules.task.repository.TaskTemplateRepository;
import com.privod.platform.modules.task.web.dto.CreateTaskTemplateRequest;
import com.privod.platform.modules.task.web.dto.TaskTemplateResponse;
import com.privod.platform.modules.task.web.dto.UpdateTaskTemplateRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TaskTemplateService {

    private final TaskTemplateRepository templateRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public TaskTemplateResponse getTemplate(UUID id) {
        TaskTemplate template = getTemplateOrThrow(id);
        return TaskTemplateResponse.fromEntity(template);
    }

    @Transactional(readOnly = true)
    public Page<TaskTemplateResponse> listTemplates(boolean activeOnly, Pageable pageable) {
        Page<TaskTemplate> templates = activeOnly
                ? templateRepository.findByDeletedFalseAndIsActiveTrue(pageable)
                : templateRepository.findByDeletedFalse(pageable);
        return templates.map(TaskTemplateResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public List<TaskTemplateResponse> listTemplatesByCategory(String category) {
        return templateRepository.findByCategoryAndDeletedFalseAndIsActiveTrue(category)
                .stream()
                .map(TaskTemplateResponse::fromEntity)
                .toList();
    }

    @Transactional
    public TaskTemplateResponse createTemplate(CreateTaskTemplateRequest request) {
        TaskTemplate template = TaskTemplate.builder()
                .name(request.name())
                .description(request.description())
                .defaultPriority(request.defaultPriority() != null ? request.defaultPriority() : TaskPriority.NORMAL)
                .estimatedHours(request.estimatedHours())
                .category(request.category())
                .checklistTemplate(request.checklistTemplate())
                .tags(request.tags())
                .isActive(true)
                .build();

        template = templateRepository.save(template);
        auditService.logCreate("TaskTemplate", template.getId());

        log.info("Task template created: {} ({})", template.getName(), template.getId());
        return TaskTemplateResponse.fromEntity(template);
    }

    @Transactional
    public TaskTemplateResponse updateTemplate(UUID id, UpdateTaskTemplateRequest request) {
        TaskTemplate template = getTemplateOrThrow(id);

        if (request.name() != null) {
            template.setName(request.name());
        }
        if (request.description() != null) {
            template.setDescription(request.description());
        }
        if (request.defaultPriority() != null) {
            template.setDefaultPriority(request.defaultPriority());
        }
        if (request.estimatedHours() != null) {
            template.setEstimatedHours(request.estimatedHours());
        }
        if (request.category() != null) {
            template.setCategory(request.category());
        }
        if (request.checklistTemplate() != null) {
            template.setChecklistTemplate(request.checklistTemplate());
        }
        if (request.tags() != null) {
            template.setTags(request.tags());
        }
        if (request.isActive() != null) {
            template.setActive(request.isActive());
        }

        template = templateRepository.save(template);
        auditService.logUpdate("TaskTemplate", template.getId(), "multiple", null, null);

        log.info("Task template updated: {} ({})", template.getName(), template.getId());
        return TaskTemplateResponse.fromEntity(template);
    }

    @Transactional
    public void deleteTemplate(UUID id) {
        TaskTemplate template = getTemplateOrThrow(id);
        template.softDelete();
        templateRepository.save(template);
        auditService.logDelete("TaskTemplate", id);
        log.info("Task template soft-deleted: {} ({})", template.getName(), id);
    }

    private TaskTemplate getTemplateOrThrow(UUID id) {
        return templateRepository.findById(id)
                .filter(t -> !t.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Шаблон задачи не найден: " + id));
    }
}
