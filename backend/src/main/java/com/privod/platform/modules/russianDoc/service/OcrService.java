package com.privod.platform.modules.russianDoc.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.russianDoc.domain.OcrTask;
import com.privod.platform.modules.russianDoc.domain.OcrTaskStatus;
import com.privod.platform.modules.russianDoc.domain.OcrTemplate;
import com.privod.platform.modules.russianDoc.repository.OcrTaskRepository;
import com.privod.platform.modules.russianDoc.repository.OcrTemplateRepository;
import com.privod.platform.modules.russianDoc.web.dto.CreateOcrTaskRequest;
import com.privod.platform.modules.russianDoc.web.dto.OcrTaskResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class OcrService {

    private final OcrTaskRepository taskRepository;
    private final OcrTemplateRepository templateRepository;
    private final AuditService auditService;

    // ============================
    // Tasks
    // ============================

    @Transactional(readOnly = true)
    public Page<OcrTaskResponse> listTasks(UUID projectId, Pageable pageable) {
        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();
        Page<OcrTask> page = projectId != null
                ? taskRepository.findByOrganizationIdAndProjectIdAndDeletedFalse(currentOrgId, projectId, pageable)
                : taskRepository.findByOrganizationIdAndDeletedFalse(currentOrgId, pageable);
        return page.map(OcrTaskResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public OcrTaskResponse getTask(UUID id) {
        OcrTask task = getTaskOrThrow(id);
        return OcrTaskResponse.fromEntity(task);
    }

    @Transactional
    public OcrTaskResponse createTask(CreateOcrTaskRequest request) {
        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();
        if (request.organizationId() != null && !request.organizationId().equals(currentOrgId)) {
            throw new AccessDeniedException("Cannot create OCR task in another organization");
        }

        OcrTask task = OcrTask.builder()
                .fileUrl(request.fileUrl())
                .fileName(request.fileName())
                .status(OcrTaskStatus.PENDING)
                .organizationId(currentOrgId)
                .projectId(request.projectId())
                .build();

        task = taskRepository.save(task);
        auditService.logCreate("OcrTask", task.getId());

        log.info("OCR задача создана: {} ({})", task.getFileName(), task.getId());
        return OcrTaskResponse.fromEntity(task);
    }

    @Transactional
    public OcrTaskResponse startProcessing(UUID id) {
        OcrTask task = getTaskOrThrow(id);

        if (task.getStatus() != OcrTaskStatus.PENDING) {
            throw new IllegalStateException(
                    "Запустить распознавание можно только для задач в статусе PENDING");
        }

        task.setStatus(OcrTaskStatus.PROCESSING);
        task = taskRepository.save(task);
        auditService.logStatusChange("OcrTask", task.getId(), "PENDING", "PROCESSING");

        log.info("OCR задача запущена: {} ({})", task.getFileName(), task.getId());
        return OcrTaskResponse.fromEntity(task);
    }

    @Transactional
    public OcrTaskResponse completeTask(UUID id, String recognizedText, String recognizedFields, Double confidence) {
        OcrTask task = getTaskOrThrow(id);

        if (task.getStatus() != OcrTaskStatus.PROCESSING) {
            throw new IllegalStateException(
                    "Завершить можно только задачу в статусе PROCESSING");
        }

        task.setStatus(OcrTaskStatus.COMPLETED);
        task.setRecognizedText(recognizedText);
        task.setRecognizedFields(recognizedFields);
        task.setConfidence(confidence);
        task.setProcessedAt(Instant.now());

        task = taskRepository.save(task);
        auditService.logStatusChange("OcrTask", task.getId(), "PROCESSING", "COMPLETED");

        log.info("OCR задача завершена: {} (confidence: {}) ({})",
                task.getFileName(), confidence, task.getId());
        return OcrTaskResponse.fromEntity(task);
    }

    @Transactional
    public OcrTaskResponse failTask(UUID id, String errorMessage) {
        OcrTask task = getTaskOrThrow(id);

        task.setStatus(OcrTaskStatus.FAILED);
        task.setRecognizedText(errorMessage);
        task.setProcessedAt(Instant.now());

        task = taskRepository.save(task);
        auditService.logStatusChange("OcrTask", task.getId(), task.getStatus().name(), "FAILED");

        log.warn("OCR задача не удалась: {} - {} ({})", task.getFileName(), errorMessage, task.getId());
        return OcrTaskResponse.fromEntity(task);
    }

    @Transactional
    public void deleteTask(UUID id) {
        OcrTask task = getTaskOrThrow(id);
        task.softDelete();
        taskRepository.save(task);
        auditService.logDelete("OcrTask", task.getId());

        log.info("OCR задача удалена: {} ({})", task.getFileName(), task.getId());
    }

    @Transactional(readOnly = true)
    public List<OcrTaskResponse> getPendingTasks() {
        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();
        return taskRepository.findByOrganizationIdAndStatusAndDeletedFalse(currentOrgId, OcrTaskStatus.PENDING)
                .stream()
                .map(OcrTaskResponse::fromEntity)
                .toList();
    }

    private OcrTask getTaskOrThrow(UUID id) {
        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();
        return taskRepository.findByIdAndOrganizationIdAndDeletedFalse(id, currentOrgId)
                .orElseThrow(() -> new EntityNotFoundException("OCR задача не найдена: " + id));
    }

    // ============================
    // Templates
    // ============================

    @Transactional(readOnly = true)
    public Page<OcrTemplate> listTemplates(Pageable pageable) {
        return templateRepository.findByDeletedFalse(pageable);
    }

    @Transactional(readOnly = true)
    public List<OcrTemplate> getActiveTemplates() {
        return templateRepository.findByIsActiveTrueAndDeletedFalse();
    }
}
