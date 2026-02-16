package com.privod.platform.modules.legal.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.legal.domain.CaseStatus;
import com.privod.platform.modules.legal.domain.ContractLegalTemplate;
import com.privod.platform.modules.legal.domain.LegalCase;
import com.privod.platform.modules.legal.domain.LegalDecision;
import com.privod.platform.modules.legal.domain.LegalRemark;
import com.privod.platform.modules.legal.domain.LegalTemplateType;
import com.privod.platform.modules.legal.repository.ContractLegalTemplateRepository;
import com.privod.platform.modules.legal.repository.LegalCaseRepository;
import com.privod.platform.modules.legal.repository.LegalDecisionRepository;
import com.privod.platform.modules.legal.repository.LegalRemarkRepository;
import com.privod.platform.modules.legal.web.dto.ContractLegalTemplateResponse;
import com.privod.platform.modules.legal.web.dto.CreateLegalCaseRequest;
import com.privod.platform.modules.legal.web.dto.CreateLegalDecisionRequest;
import com.privod.platform.modules.legal.web.dto.CreateLegalRemarkRequest;
import com.privod.platform.modules.legal.web.dto.CreateLegalTemplateRequest;
import com.privod.platform.modules.legal.web.dto.LegalCaseResponse;
import com.privod.platform.modules.legal.web.dto.LegalDashboardResponse;
import com.privod.platform.modules.legal.web.dto.LegalDecisionResponse;
import com.privod.platform.modules.legal.web.dto.LegalRemarkResponse;
import com.privod.platform.modules.legal.web.dto.UpdateLegalCaseRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class LegalService {

    private final LegalCaseRepository caseRepository;
    private final LegalDecisionRepository decisionRepository;
    private final LegalRemarkRepository remarkRepository;
    private final ContractLegalTemplateRepository templateRepository;
    private final AuditService auditService;

    // ===================== Cases =====================

    @Transactional(readOnly = true)
    public Page<LegalCaseResponse> listCases(String search, CaseStatus status, UUID projectId,
                                               UUID lawyerId, Pageable pageable) {
        if (search != null && !search.isBlank()) {
            return caseRepository.search(search, pageable).map(LegalCaseResponse::fromEntity);
        }
        if (status != null) {
            return caseRepository.findByStatusAndDeletedFalse(status, pageable).map(LegalCaseResponse::fromEntity);
        }
        if (projectId != null) {
            return caseRepository.findByProjectIdAndDeletedFalse(projectId, pageable).map(LegalCaseResponse::fromEntity);
        }
        if (lawyerId != null) {
            return caseRepository.findByLawyerIdAndDeletedFalse(lawyerId, pageable).map(LegalCaseResponse::fromEntity);
        }
        return caseRepository.findAll(pageable).map(LegalCaseResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public LegalCaseResponse getCase(UUID id) {
        LegalCase legalCase = getCaseOrThrow(id);
        return LegalCaseResponse.fromEntity(legalCase);
    }

    @Transactional
    public LegalCaseResponse createCase(CreateLegalCaseRequest request) {
        LegalCase legalCase = LegalCase.builder()
                .caseNumber(request.caseNumber())
                .projectId(request.projectId())
                .contractId(request.contractId())
                .title(request.title())
                .description(request.description())
                .caseType(request.caseType())
                .status(CaseStatus.OPEN)
                .amount(request.amount())
                .currency(request.currency() != null ? request.currency() : "RUB")
                .responsibleId(request.responsibleId())
                .lawyerId(request.lawyerId())
                .courtName(request.courtName())
                .filingDate(request.filingDate())
                .hearingDate(request.hearingDate())
                .build();

        legalCase = caseRepository.save(legalCase);
        auditService.logCreate("LegalCase", legalCase.getId());

        log.info("Legal case created: {} - {} ({})", legalCase.getCaseNumber(), legalCase.getTitle(), legalCase.getId());
        return LegalCaseResponse.fromEntity(legalCase);
    }

    @Transactional
    public LegalCaseResponse updateCase(UUID id, UpdateLegalCaseRequest request) {
        LegalCase legalCase = getCaseOrThrow(id);

        if (request.caseNumber() != null) legalCase.setCaseNumber(request.caseNumber());
        if (request.projectId() != null) legalCase.setProjectId(request.projectId());
        if (request.contractId() != null) legalCase.setContractId(request.contractId());
        if (request.title() != null) legalCase.setTitle(request.title());
        if (request.description() != null) legalCase.setDescription(request.description());
        if (request.caseType() != null) legalCase.setCaseType(request.caseType());
        if (request.status() != null) {
            CaseStatus oldStatus = legalCase.getStatus();
            legalCase.setStatus(request.status());
            auditService.logStatusChange("LegalCase", legalCase.getId(), oldStatus.name(), request.status().name());
        }
        if (request.amount() != null) legalCase.setAmount(request.amount());
        if (request.currency() != null) legalCase.setCurrency(request.currency());
        if (request.responsibleId() != null) legalCase.setResponsibleId(request.responsibleId());
        if (request.lawyerId() != null) legalCase.setLawyerId(request.lawyerId());
        if (request.courtName() != null) legalCase.setCourtName(request.courtName());
        if (request.filingDate() != null) legalCase.setFilingDate(request.filingDate());
        if (request.hearingDate() != null) legalCase.setHearingDate(request.hearingDate());
        if (request.resolutionDate() != null) legalCase.setResolutionDate(request.resolutionDate());
        if (request.outcome() != null) legalCase.setOutcome(request.outcome());

        legalCase = caseRepository.save(legalCase);
        auditService.logUpdate("LegalCase", legalCase.getId(), "multiple", null, null);

        log.info("Legal case updated: {} ({})", legalCase.getCaseNumber(), legalCase.getId());
        return LegalCaseResponse.fromEntity(legalCase);
    }

    @Transactional
    public void deleteCase(UUID id) {
        LegalCase legalCase = getCaseOrThrow(id);
        legalCase.softDelete();
        caseRepository.save(legalCase);
        auditService.logDelete("LegalCase", id);
        log.info("Legal case deleted: {} ({})", legalCase.getCaseNumber(), id);
    }

    @Transactional(readOnly = true)
    public LegalDashboardResponse getDashboard() {
        Map<String, Long> statusCounts = new HashMap<>();
        List<Object[]> statusData = caseRepository.countByStatus();
        long total = 0;
        long open = 0;
        long closed = 0;

        for (Object[] row : statusData) {
            CaseStatus s = (CaseStatus) row[0];
            Long count = (Long) row[1];
            statusCounts.put(s.name(), count);
            total += count;
            if (s == CaseStatus.CLOSED || s == CaseStatus.WON || s == CaseStatus.LOST) {
                closed += count;
            } else {
                open += count;
            }
        }

        BigDecimal activeAmount = caseRepository.sumActiveClaimsAmount();

        return new LegalDashboardResponse(total, statusCounts,
                activeAmount != null ? activeAmount : BigDecimal.ZERO, open, closed);
    }

    @Transactional(readOnly = true)
    public List<LegalCaseResponse> getUpcomingHearings(int days) {
        LocalDate from = LocalDate.now();
        LocalDate to = from.plusDays(days);
        return caseRepository.findUpcomingHearings(from, to)
                .stream()
                .map(LegalCaseResponse::fromEntity)
                .toList();
    }

    // ===================== Decisions =====================

    @Transactional(readOnly = true)
    public List<LegalDecisionResponse> getCaseDecisions(UUID caseId) {
        getCaseOrThrow(caseId);
        return decisionRepository.findByCaseIdAndDeletedFalseOrderByDecisionDateDesc(caseId)
                .stream()
                .map(LegalDecisionResponse::fromEntity)
                .toList();
    }

    @Transactional
    public LegalDecisionResponse createDecision(CreateLegalDecisionRequest request) {
        getCaseOrThrow(request.caseId());

        LegalDecision decision = LegalDecision.builder()
                .caseId(request.caseId())
                .decisionDate(request.decisionDate())
                .decisionType(request.decisionType())
                .summary(request.summary())
                .amount(request.amount())
                .enforceable(request.enforceable() != null ? request.enforceable() : false)
                .enforcementDeadline(request.enforcementDeadline())
                .fileUrl(request.fileUrl())
                .build();

        decision = decisionRepository.save(decision);
        auditService.logCreate("LegalDecision", decision.getId());

        log.info("Legal decision created for case {}: {} ({})", request.caseId(),
                decision.getDecisionType(), decision.getId());
        return LegalDecisionResponse.fromEntity(decision);
    }

    @Transactional
    public LegalDecisionResponse updateDecision(UUID id, CreateLegalDecisionRequest request) {
        LegalDecision decision = decisionRepository.findById(id)
                .filter(d -> !d.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Судебное решение не найдено: " + id));

        if (request.decisionDate() != null) decision.setDecisionDate(request.decisionDate());
        if (request.decisionType() != null) decision.setDecisionType(request.decisionType());
        if (request.summary() != null) decision.setSummary(request.summary());
        if (request.amount() != null) decision.setAmount(request.amount());
        if (request.enforceable() != null) decision.setEnforceable(request.enforceable());
        if (request.enforcementDeadline() != null) decision.setEnforcementDeadline(request.enforcementDeadline());
        if (request.fileUrl() != null) decision.setFileUrl(request.fileUrl());

        decision = decisionRepository.save(decision);
        auditService.logUpdate("LegalDecision", decision.getId(), "multiple", null, null);

        log.info("Legal decision updated: {}", decision.getId());
        return LegalDecisionResponse.fromEntity(decision);
    }

    @Transactional
    public void deleteDecision(UUID id) {
        LegalDecision decision = decisionRepository.findById(id)
                .filter(d -> !d.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Судебное решение не найдено: " + id));

        decision.softDelete();
        decisionRepository.save(decision);
        auditService.logDelete("LegalDecision", id);
        log.info("Legal decision deleted: {}", id);
    }

    // ===================== Remarks =====================

    @Transactional(readOnly = true)
    public List<LegalRemarkResponse> getCaseRemarks(UUID caseId, boolean includeConfidential) {
        getCaseOrThrow(caseId);
        if (includeConfidential) {
            return remarkRepository.findByCaseIdAndDeletedFalseOrderByRemarkDateDesc(caseId)
                    .stream()
                    .map(LegalRemarkResponse::fromEntity)
                    .toList();
        }
        return remarkRepository.findByCaseIdAndConfidentialFalseAndDeletedFalseOrderByRemarkDateDesc(caseId)
                .stream()
                .map(LegalRemarkResponse::fromEntity)
                .toList();
    }

    @Transactional
    public LegalRemarkResponse createRemark(CreateLegalRemarkRequest request) {
        getCaseOrThrow(request.caseId());

        LegalRemark remark = LegalRemark.builder()
                .caseId(request.caseId())
                .authorId(request.authorId())
                .remarkDate(request.remarkDate() != null ? request.remarkDate() : LocalDate.now())
                .content(request.content())
                .remarkType(request.remarkType())
                .confidential(request.confidential() != null ? request.confidential() : false)
                .build();

        remark = remarkRepository.save(remark);
        auditService.logCreate("LegalRemark", remark.getId());

        log.info("Legal remark created for case {}: {} ({})", request.caseId(),
                remark.getRemarkType(), remark.getId());
        return LegalRemarkResponse.fromEntity(remark);
    }

    @Transactional
    public LegalRemarkResponse updateRemark(UUID id, CreateLegalRemarkRequest request) {
        LegalRemark remark = remarkRepository.findById(id)
                .filter(r -> !r.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Замечание не найдено: " + id));

        if (request.content() != null) remark.setContent(request.content());
        if (request.remarkType() != null) remark.setRemarkType(request.remarkType());
        if (request.confidential() != null) remark.setConfidential(request.confidential());
        if (request.remarkDate() != null) remark.setRemarkDate(request.remarkDate());

        remark = remarkRepository.save(remark);
        auditService.logUpdate("LegalRemark", remark.getId(), "multiple", null, null);

        log.info("Legal remark updated: {}", remark.getId());
        return LegalRemarkResponse.fromEntity(remark);
    }

    @Transactional
    public void deleteRemark(UUID id) {
        LegalRemark remark = remarkRepository.findById(id)
                .filter(r -> !r.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Замечание не найдено: " + id));

        remark.softDelete();
        remarkRepository.save(remark);
        auditService.logDelete("LegalRemark", id);
        log.info("Legal remark deleted: {}", id);
    }

    // ===================== Templates =====================

    @Transactional(readOnly = true)
    public Page<ContractLegalTemplateResponse> listTemplates(String search, LegalTemplateType type,
                                                              Pageable pageable) {
        if (search != null && !search.isBlank()) {
            return templateRepository.search(search, pageable).map(ContractLegalTemplateResponse::fromEntity);
        }
        if (type != null) {
            return templateRepository.findByTemplateTypeAndActiveTrueAndDeletedFalse(type)
                    .stream()
                    .map(ContractLegalTemplateResponse::fromEntity)
                    .collect(java.util.stream.Collectors.collectingAndThen(
                            java.util.stream.Collectors.toList(),
                            list -> new org.springframework.data.domain.PageImpl<>(list, pageable, list.size())
                    ));
        }
        return templateRepository.findByActiveTrueAndDeletedFalse(pageable)
                .map(ContractLegalTemplateResponse::fromEntity);
    }

    @Transactional
    public ContractLegalTemplateResponse createTemplate(CreateLegalTemplateRequest request) {
        ContractLegalTemplate template = ContractLegalTemplate.builder()
                .name(request.name())
                .templateType(request.templateType())
                .category(request.category())
                .content(request.content())
                .variables(request.variables())
                .active(true)
                .templateVersion(1)
                .build();

        template = templateRepository.save(template);
        auditService.logCreate("ContractLegalTemplate", template.getId());

        log.info("Legal template created: {} - {} ({})", template.getName(),
                template.getTemplateType(), template.getId());
        return ContractLegalTemplateResponse.fromEntity(template);
    }

    @Transactional
    public ContractLegalTemplateResponse updateTemplate(UUID id, CreateLegalTemplateRequest request) {
        ContractLegalTemplate template = templateRepository.findById(id)
                .filter(t -> !t.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Шаблон не найден: " + id));

        if (request.name() != null) template.setName(request.name());
        if (request.templateType() != null) template.setTemplateType(request.templateType());
        if (request.category() != null) template.setCategory(request.category());
        if (request.content() != null) template.setContent(request.content());
        if (request.variables() != null) template.setVariables(request.variables());

        template = templateRepository.save(template);
        auditService.logUpdate("ContractLegalTemplate", template.getId(), "multiple", null, null);

        log.info("Legal template updated: {} ({})", template.getName(), template.getId());
        return ContractLegalTemplateResponse.fromEntity(template);
    }

    @Transactional
    public void deleteTemplate(UUID id) {
        ContractLegalTemplate template = templateRepository.findById(id)
                .filter(t -> !t.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Шаблон не найден: " + id));

        template.softDelete();
        templateRepository.save(template);
        auditService.logDelete("ContractLegalTemplate", id);
        log.info("Legal template deleted: {}", id);
    }

    // ===================== Helpers =====================

    private LegalCase getCaseOrThrow(UUID id) {
        return caseRepository.findById(id)
                .filter(c -> !c.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Юридическое дело не найдено: " + id));
    }
}
