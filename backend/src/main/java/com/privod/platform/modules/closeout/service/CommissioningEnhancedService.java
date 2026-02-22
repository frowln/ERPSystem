package com.privod.platform.modules.closeout.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.closeout.domain.*;
import com.privod.platform.modules.closeout.repository.*;
import com.privod.platform.modules.closeout.web.dto.*;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CommissioningEnhancedService {

    private final CommissioningChecklistTemplateRepository templateRepository;
    private final CommissioningSignOffRepository signOffRepository;
    private final ZosDocumentRepository zosRepository;
    private final AuditService auditService;

    // ========== Templates ==========

    @Transactional(readOnly = true)
    public Page<CommissioningTemplateResponse> findAllTemplates(Pageable pageable) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        return templateRepository.findByOrganizationIdAndDeletedFalse(orgId, pageable)
                .map(CommissioningTemplateResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public List<CommissioningTemplateResponse> findTemplatesBySystem(String system) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        return templateRepository.findByOrganizationIdAndSystemAndDeletedFalseOrderBySortOrder(orgId, system)
                .stream().map(CommissioningTemplateResponse::fromEntity).toList();
    }

    @Transactional(readOnly = true)
    public List<CommissioningTemplateResponse> findOrgDefaultTemplates() {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        return templateRepository.findByOrganizationIdAndProjectIdIsNullAndDeletedFalseOrderBySortOrder(orgId)
                .stream().map(CommissioningTemplateResponse::fromEntity).toList();
    }

    @Transactional(readOnly = true)
    public CommissioningTemplateResponse findTemplateById(UUID id) {
        CommissioningChecklistTemplate template = templateRepository.findById(id)
                .filter(t -> !t.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Шаблон не найден: " + id));
        return CommissioningTemplateResponse.fromEntity(template);
    }

    @Transactional
    public CommissioningTemplateResponse createTemplate(CreateCommissioningTemplateRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        CommissioningChecklistTemplate template = CommissioningChecklistTemplate.builder()
                .organizationId(orgId)
                .projectId(request.projectId())
                .name(request.name())
                .system(request.system())
                .description(request.description())
                .checkItemDefinitions(request.checkItemDefinitions())
                .sortOrder(request.sortOrder() != null ? request.sortOrder() : 0)
                .isActive(true)
                .build();

        template = templateRepository.save(template);
        auditService.logCreate("CommissioningChecklistTemplate", template.getId());
        log.info("Шаблон чек-листа создан: {} ({})", template.getName(), template.getId());
        return CommissioningTemplateResponse.fromEntity(template);
    }

    @Transactional
    public CommissioningTemplateResponse updateTemplate(UUID id, CreateCommissioningTemplateRequest request) {
        CommissioningChecklistTemplate template = templateRepository.findById(id)
                .filter(t -> !t.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Шаблон не найден: " + id));

        if (request.name() != null) template.setName(request.name());
        if (request.system() != null) template.setSystem(request.system());
        if (request.description() != null) template.setDescription(request.description());
        if (request.checkItemDefinitions() != null) template.setCheckItemDefinitions(request.checkItemDefinitions());
        if (request.sortOrder() != null) template.setSortOrder(request.sortOrder());

        template = templateRepository.save(template);
        auditService.logUpdate("CommissioningChecklistTemplate", id, "multiple", null, null);
        return CommissioningTemplateResponse.fromEntity(template);
    }

    @Transactional
    public void deleteTemplate(UUID id) {
        CommissioningChecklistTemplate template = templateRepository.findById(id)
                .filter(t -> !t.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Шаблон не найден: " + id));
        template.softDelete();
        templateRepository.save(template);
        auditService.logDelete("CommissioningChecklistTemplate", id);
    }

    // ========== Sign-Offs ==========

    @Transactional(readOnly = true)
    public List<CommissioningSignOffResponse> findSignOffs(UUID checklistId) {
        return signOffRepository.findByChecklistIdAndDeletedFalseOrderByCreatedAtAsc(checklistId)
                .stream().map(CommissioningSignOffResponse::fromEntity).toList();
    }

    @Transactional
    public CommissioningSignOffResponse createSignOff(CreateCommissioningSignOffRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        CommissioningSignOff signOff = CommissioningSignOff.builder()
                .organizationId(orgId)
                .checklistId(request.checklistId())
                .signerName(request.signerName())
                .signerRole(request.signerRole())
                .signerOrganization(request.signerOrganization())
                .decision(request.decision())
                .comments(request.comments())
                .signedAt(request.decision() != SignOffDecision.PENDING ? Instant.now() : null)
                .build();

        signOff = signOffRepository.save(signOff);
        auditService.logCreate("CommissioningSignOff", signOff.getId());
        log.info("Подпись добавлена к чек-листу {}: {} ({})", request.checklistId(), request.signerName(), signOff.getId());
        return CommissioningSignOffResponse.fromEntity(signOff);
    }

    @Transactional
    public CommissioningSignOffResponse updateSignOffDecision(UUID signOffId, SignOffDecision decision, String comments) {
        CommissioningSignOff signOff = signOffRepository.findById(signOffId)
                .filter(s -> !s.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Подпись не найдена: " + signOffId));

        SignOffDecision oldDecision = signOff.getDecision();
        signOff.setDecision(decision);
        signOff.setComments(comments);
        if (decision != SignOffDecision.PENDING) {
            signOff.setSignedAt(Instant.now());
        }

        signOff = signOffRepository.save(signOff);
        auditService.logStatusChange("CommissioningSignOff", signOffId, oldDecision.name(), decision.name());
        return CommissioningSignOffResponse.fromEntity(signOff);
    }

    @Transactional
    public void deleteSignOff(UUID signOffId) {
        CommissioningSignOff signOff = signOffRepository.findById(signOffId)
                .filter(s -> !s.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Подпись не найдена: " + signOffId));
        signOff.softDelete();
        signOffRepository.save(signOff);
        auditService.logDelete("CommissioningSignOff", signOffId);
    }

    // ========== ZOS Documents ==========

    @Transactional(readOnly = true)
    public Page<ZosDocumentResponse> findAllZos(Pageable pageable) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        return zosRepository.findByOrganizationIdAndDeletedFalse(orgId, pageable)
                .map(ZosDocumentResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public List<ZosDocumentResponse> findZosByProject(UUID projectId) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        return zosRepository.findByOrganizationIdAndProjectIdAndDeletedFalse(orgId, projectId)
                .stream().map(ZosDocumentResponse::fromEntity).toList();
    }

    @Transactional(readOnly = true)
    public ZosDocumentResponse findZosById(UUID id) {
        ZosDocument zos = zosRepository.findById(id)
                .filter(z -> !z.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("ЗОС не найден: " + id));
        return ZosDocumentResponse.fromEntity(zos);
    }

    @Transactional
    public ZosDocumentResponse createZos(CreateZosDocumentRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        ZosDocument zos = ZosDocument.builder()
                .organizationId(orgId)
                .projectId(request.projectId())
                .documentNumber(request.documentNumber())
                .title(request.title())
                .system(request.system())
                .checklistIds(request.checklistIds())
                .issuedDate(request.issuedDate())
                .issuedByName(request.issuedByName())
                .issuedByOrganization(request.issuedByOrganization())
                .status(ZosStatus.DRAFT)
                .conclusionText(request.conclusionText())
                .remarks(request.remarks())
                .attachmentIds(request.attachmentIds())
                .build();

        zos = zosRepository.save(zos);
        auditService.logCreate("ZosDocument", zos.getId());
        log.info("ЗОС создан: {} ({})", zos.getDocumentNumber(), zos.getId());
        return ZosDocumentResponse.fromEntity(zos);
    }

    @Transactional
    public ZosDocumentResponse updateZos(UUID id, CreateZosDocumentRequest request) {
        ZosDocument zos = zosRepository.findById(id)
                .filter(z -> !z.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("ЗОС не найден: " + id));

        if (request.documentNumber() != null) zos.setDocumentNumber(request.documentNumber());
        if (request.title() != null) zos.setTitle(request.title());
        if (request.system() != null) zos.setSystem(request.system());
        if (request.checklistIds() != null) zos.setChecklistIds(request.checklistIds());
        if (request.issuedDate() != null) zos.setIssuedDate(request.issuedDate());
        if (request.issuedByName() != null) zos.setIssuedByName(request.issuedByName());
        if (request.issuedByOrganization() != null) zos.setIssuedByOrganization(request.issuedByOrganization());
        if (request.conclusionText() != null) zos.setConclusionText(request.conclusionText());
        if (request.remarks() != null) zos.setRemarks(request.remarks());
        if (request.attachmentIds() != null) zos.setAttachmentIds(request.attachmentIds());

        zos = zosRepository.save(zos);
        auditService.logUpdate("ZosDocument", id, "multiple", null, null);
        return ZosDocumentResponse.fromEntity(zos);
    }

    @Transactional
    public ZosDocumentResponse changeZosStatus(UUID id, ZosStatus newStatus) {
        ZosDocument zos = zosRepository.findById(id)
                .filter(z -> !z.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("ЗОС не найден: " + id));

        ZosStatus oldStatus = zos.getStatus();
        zos.setStatus(newStatus);
        zos = zosRepository.save(zos);
        auditService.logStatusChange("ZosDocument", id, oldStatus.name(), newStatus.name());
        log.info("Статус ЗОС {} изменён: {} → {}", id, oldStatus, newStatus);
        return ZosDocumentResponse.fromEntity(zos);
    }

    @Transactional
    public void deleteZos(UUID id) {
        ZosDocument zos = zosRepository.findById(id)
                .filter(z -> !z.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("ЗОС не найден: " + id));
        zos.softDelete();
        zosRepository.save(zos);
        auditService.logDelete("ZosDocument", id);
    }
}
