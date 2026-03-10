package com.privod.platform.modules.quality.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.quality.domain.ChecklistTemplate;
import com.privod.platform.modules.quality.repository.ChecklistTemplateRepository;
import com.privod.platform.modules.quality.web.dto.ChecklistTemplateResponse;
import com.privod.platform.modules.quality.web.dto.CreateChecklistTemplateRequest;
import com.privod.platform.modules.quality.web.dto.UpdateChecklistTemplateRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChecklistTemplateService {

    private final ChecklistTemplateRepository checklistTemplateRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<ChecklistTemplateResponse> list(Pageable pageable) {
        return checklistTemplateRepository.findByDeletedFalse(pageable)
                .map(ChecklistTemplateResponse::fromEntity);
    }

    @Transactional
    public ChecklistTemplateResponse create(CreateChecklistTemplateRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();

        ChecklistTemplate template = ChecklistTemplate.builder()
                .organizationId(organizationId)
                .name(request.name())
                .workType(request.workType())
                .items(request.items() != null ? request.items() : new ArrayList<>())
                .build();

        template = checklistTemplateRepository.save(template);
        auditService.logCreate("ChecklistTemplate", template.getId());

        log.info("Checklist template created: {} ({})", template.getName(), template.getId());
        return ChecklistTemplateResponse.fromEntity(template);
    }

    @Transactional
    public ChecklistTemplateResponse update(UUID id, UpdateChecklistTemplateRequest request) {
        ChecklistTemplate template = getOrThrow(id);

        if (request.name() != null) {
            template.setName(request.name());
        }
        if (request.workType() != null) {
            template.setWorkType(request.workType());
        }
        if (request.items() != null) {
            template.setItems(request.items());
        }

        template = checklistTemplateRepository.save(template);
        auditService.logUpdate("ChecklistTemplate", template.getId(), "multiple", null, null);

        log.info("Checklist template updated: {} ({})", template.getName(), template.getId());
        return ChecklistTemplateResponse.fromEntity(template);
    }

    private ChecklistTemplate getOrThrow(UUID id) {
        return checklistTemplateRepository.findById(id)
                .filter(t -> !t.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Шаблон чек-листа не найден: " + id));
    }
}
