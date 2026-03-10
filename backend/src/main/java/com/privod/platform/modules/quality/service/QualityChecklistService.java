package com.privod.platform.modules.quality.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.quality.domain.ChecklistExecutionItem;
import com.privod.platform.modules.quality.domain.ChecklistExecutionStatus;
import com.privod.platform.modules.quality.domain.ChecklistItemResult;
import com.privod.platform.modules.quality.domain.QualityChecklist;
import com.privod.platform.modules.quality.repository.ChecklistExecutionItemRepository;
import com.privod.platform.modules.quality.repository.QualityChecklistRepository;
import com.privod.platform.modules.quality.web.dto.ChecklistExecutionItemResponse;
import com.privod.platform.modules.quality.web.dto.CreateQualityChecklistRequest;
import com.privod.platform.modules.quality.web.dto.QualityChecklistResponse;
import com.privod.platform.modules.quality.web.dto.UpdateChecklistItemRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class QualityChecklistService {

    private final QualityChecklistRepository checklistRepository;
    private final ChecklistExecutionItemRepository itemRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<QualityChecklistResponse> listChecklists(UUID projectId, Pageable pageable) {
        if (projectId != null) {
            return checklistRepository.findByProjectIdAndDeletedFalse(projectId, pageable)
                    .map(QualityChecklistResponse::fromEntity);
        }
        return checklistRepository.findByDeletedFalse(pageable)
                .map(QualityChecklistResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public QualityChecklistResponse getChecklist(UUID id) {
        QualityChecklist checklist = getOrThrow(id);
        return QualityChecklistResponse.fromEntity(checklist);
    }

    @Transactional(readOnly = true)
    public List<ChecklistExecutionItemResponse> getChecklistItems(UUID checklistId) {
        return itemRepository.findByChecklistIdAndDeletedFalseOrderBySortOrderAsc(checklistId)
                .stream()
                .map(ChecklistExecutionItemResponse::fromEntity)
                .toList();
    }

    @Transactional
    public QualityChecklistResponse createChecklist(CreateQualityChecklistRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        String code = generateCode();

        QualityChecklist checklist = QualityChecklist.builder()
                .organizationId(organizationId)
                .code(code)
                .name(request.name())
                .projectId(request.projectId())
                .templateId(request.templateId())
                .workType(request.workType())
                .wbsStage(request.wbsStage())
                .location(request.location())
                .status(ChecklistExecutionStatus.DRAFT)
                .inspectorId(request.inspectorId())
                .inspectorName(request.inspectorName())
                .scheduledDate(request.scheduledDate())
                .notes(request.notes())
                .build();

        checklist = checklistRepository.save(checklist);

        if (request.items() != null && !request.items().isEmpty()) {
            List<ChecklistExecutionItem> items = new ArrayList<>();
            for (var input : request.items()) {
                items.add(ChecklistExecutionItem.builder()
                        .checklistId(checklist.getId())
                        .description(input.description())
                        .category(input.category())
                        .required(input.required())
                        .photoRequired(input.photoRequired())
                        .sortOrder(input.sortOrder())
                        .result(ChecklistItemResult.PENDING)
                        .build());
            }
            itemRepository.saveAll(items);
            checklist.setTotalItems(items.size());
            checklist = checklistRepository.save(checklist);
        }

        auditService.logCreate("QualityChecklist", checklist.getId());
        log.info("Quality checklist created: {} - {} ({})", checklist.getCode(), checklist.getName(), checklist.getId());

        return QualityChecklistResponse.fromEntity(checklist);
    }

    @Transactional
    public ChecklistExecutionItemResponse updateChecklistItem(UUID checklistId, UUID itemId, UpdateChecklistItemRequest request) {
        QualityChecklist checklist = getOrThrow(checklistId);
        ChecklistExecutionItem item = itemRepository.findById(itemId)
                .filter(i -> !i.isDeleted() && i.getChecklistId().equals(checklistId))
                .orElseThrow(() -> new EntityNotFoundException("Пункт чек-листа не найден: " + itemId));

        item.setResult(request.result());
        if (request.notes() != null) item.setNotes(request.notes());
        if (request.inspectorId() != null) item.setInspectorId(request.inspectorId());
        if (request.inspectorName() != null) item.setInspectorName(request.inspectorName());
        if (request.photoUrls() != null) item.setPhotoUrls(request.photoUrls());
        item.setInspectedAt(Instant.now());

        item = itemRepository.save(item);

        // Auto-start checklist if still DRAFT
        if (checklist.getStatus() == ChecklistExecutionStatus.DRAFT) {
            checklist.setStatus(ChecklistExecutionStatus.IN_PROGRESS);
        }

        // Recalculate counters
        recalculateCounters(checklist);

        log.info("Checklist item updated: {} in checklist {} ({})", item.getId(), checklist.getCode(), checklist.getId());
        return ChecklistExecutionItemResponse.fromEntity(item);
    }

    @Transactional
    public QualityChecklistResponse completeChecklist(UUID id) {
        QualityChecklist checklist = getOrThrow(id);
        checklist.setStatus(ChecklistExecutionStatus.COMPLETED);
        checklist.setCompletedDate(LocalDate.now());
        recalculateCounters(checklist);
        checklist = checklistRepository.save(checklist);
        auditService.logStatusChange("QualityChecklist", checklist.getId(), "IN_PROGRESS", "COMPLETED");
        log.info("Quality checklist completed: {} ({})", checklist.getCode(), checklist.getId());
        return QualityChecklistResponse.fromEntity(checklist);
    }

    @Transactional
    public void deleteChecklist(UUID id) {
        QualityChecklist checklist = getOrThrow(id);
        checklist.softDelete();
        checklistRepository.save(checklist);
        auditService.logDelete("QualityChecklist", checklist.getId());
        log.info("Quality checklist deleted: {} ({})", checklist.getCode(), checklist.getId());
    }

    private void recalculateCounters(QualityChecklist checklist) {
        List<ChecklistExecutionItem> items = itemRepository.findByChecklistIdAndDeletedFalseOrderBySortOrderAsc(checklist.getId());
        int passed = 0, failed = 0, na = 0;
        for (var item : items) {
            switch (item.getResult()) {
                case PASS -> passed++;
                case FAIL -> failed++;
                case NA -> na++;
                default -> {} // PENDING
            }
        }
        checklist.setTotalItems(items.size());
        checklist.setPassedItems(passed);
        checklist.setFailedItems(failed);
        checklist.setNaItems(na);
        checklistRepository.save(checklist);
    }

    private QualityChecklist getOrThrow(UUID id) {
        return checklistRepository.findById(id)
                .filter(c -> !c.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Чек-лист не найден: " + id));
    }

    private String generateCode() {
        long seq = checklistRepository.getNextNumberSequence();
        return String.format("QCL-%05d", seq);
    }
}
