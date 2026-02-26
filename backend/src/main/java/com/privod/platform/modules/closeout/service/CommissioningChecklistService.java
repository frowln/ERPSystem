package com.privod.platform.modules.closeout.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.closeout.domain.ChecklistStatus;
import com.privod.platform.modules.closeout.domain.CommissioningChecklist;
import com.privod.platform.modules.closeout.repository.CommissioningChecklistRepository;
import com.privod.platform.modules.closeout.web.dto.CommissioningChecklistResponse;
import com.privod.platform.modules.closeout.web.dto.CreateCommissioningChecklistRequest;
import com.privod.platform.modules.closeout.web.dto.UpdateCommissioningChecklistRequest;
import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CommissioningChecklistService {

    private final CommissioningChecklistRepository checklistRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<CommissioningChecklistResponse> findAll(UUID projectId, ChecklistStatus status, String system,
                                                        Pageable pageable) {
        Specification<CommissioningChecklist> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("deleted"), false));
            if (projectId != null) {
                predicates.add(cb.equal(root.get("projectId"), projectId));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (system != null && !system.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("system")), "%" + system.toLowerCase() + "%"));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return checklistRepository.findAll(spec, pageable).map(CommissioningChecklistResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public CommissioningChecklistResponse findById(UUID id) {
        CommissioningChecklist checklist = getOrThrow(id);
        return CommissioningChecklistResponse.fromEntity(checklist);
    }

    @Transactional
    public CommissioningChecklistResponse create(CreateCommissioningChecklistRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();

        CommissioningChecklist checklist = CommissioningChecklist.builder()
                .projectId(request.projectId())
                .organizationId(organizationId)
                .name(request.name())
                .system(request.system())
                .status(ChecklistStatus.NOT_STARTED)
                .checkItems(request.checkItems())
                .inspectorId(request.inspectorId())
                .inspectionDate(request.inspectionDate())
                .notes(request.notes())
                .attachmentIds(request.attachmentIds())
                .build();

        checklist = checklistRepository.save(checklist);
        auditService.logCreate("CommissioningChecklist", checklist.getId());

        log.info("Пусконаладочный чек-лист создан: {} ({})", checklist.getName(), checklist.getId());
        return CommissioningChecklistResponse.fromEntity(checklist);
    }

    @Transactional
    public CommissioningChecklistResponse update(UUID id, UpdateCommissioningChecklistRequest request) {
        CommissioningChecklist checklist = getOrThrow(id);

        if (request.name() != null) {
            checklist.setName(request.name());
        }
        if (request.system() != null) {
            checklist.setSystem(request.system());
        }
        if (request.status() != null) {
            ChecklistStatus oldStatus = checklist.getStatus();
            checklist.setStatus(request.status());
            if (request.status() == ChecklistStatus.COMPLETED && request.signedOffById() != null) {
                checklist.setSignedOffById(request.signedOffById());
                checklist.setSignedOffAt(Instant.now());
            }
            auditService.logStatusChange("CommissioningChecklist", id, oldStatus.name(), request.status().name());
        }
        if (request.checkItems() != null) {
            checklist.setCheckItems(request.checkItems());
        }
        if (request.inspectorId() != null) {
            checklist.setInspectorId(request.inspectorId());
        }
        if (request.inspectionDate() != null) {
            checklist.setInspectionDate(request.inspectionDate());
        }
        if (request.notes() != null) {
            checklist.setNotes(request.notes());
        }
        if (request.attachmentIds() != null) {
            checklist.setAttachmentIds(request.attachmentIds());
        }

        checklist = checklistRepository.save(checklist);
        auditService.logUpdate("CommissioningChecklist", id, "multiple", null, null);

        log.info("Пусконаладочный чек-лист обновлён: {} ({})", checklist.getName(), checklist.getId());
        return CommissioningChecklistResponse.fromEntity(checklist);
    }

    @Transactional
    public void delete(UUID id) {
        CommissioningChecklist checklist = getOrThrow(id);
        checklist.softDelete();
        checklistRepository.save(checklist);
        auditService.logDelete("CommissioningChecklist", id);
        log.info("Пусконаладочный чек-лист удалён: {} ({})", checklist.getName(), id);
    }

    private CommissioningChecklist getOrThrow(UUID id) {
        return checklistRepository.findById(id)
                .filter(c -> !c.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Пусконаладочный чек-лист не найден: " + id));
    }
}
