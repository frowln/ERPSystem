package com.privod.platform.modules.legal.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.auth.domain.User;
import com.privod.platform.modules.auth.repository.UserRepository;
import com.privod.platform.modules.contract.domain.Contract;
import com.privod.platform.modules.contract.repository.ContractRepository;
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
import com.privod.platform.modules.project.domain.Project;
import com.privod.platform.modules.project.repository.ProjectRepository;
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
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final ContractRepository contractRepository;
    private final AuditService auditService;

    // ===================== Cases =====================

    @Transactional(readOnly = true)
    public Page<LegalCaseResponse> listCases(String search, CaseStatus status, UUID projectId,
                                               UUID lawyerId, Pageable pageable) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        if (search != null && !search.isBlank()) {
            return caseRepository.searchByOrganizationId(search, organizationId, pageable)
                    .map(LegalCaseResponse::fromEntity);
        }
        if (status != null) {
            return caseRepository.findByOrganizationIdAndStatusAndDeletedFalse(organizationId, status, pageable)
                    .map(LegalCaseResponse::fromEntity);
        }
        if (projectId != null) {
            validateProjectTenant(projectId, organizationId);
            return caseRepository.findByOrganizationIdAndProjectIdAndDeletedFalse(organizationId, projectId, pageable)
                    .map(LegalCaseResponse::fromEntity);
        }
        if (lawyerId != null) {
            validateUserTenant(lawyerId, organizationId);
            return caseRepository.findByOrganizationIdAndLawyerIdAndDeletedFalse(organizationId, lawyerId, pageable)
                    .map(LegalCaseResponse::fromEntity);
        }
        return caseRepository.findByOrganizationIdAndDeletedFalse(organizationId, pageable)
                .map(LegalCaseResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public LegalCaseResponse getCase(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        LegalCase legalCase = getCaseOrThrow(id, organizationId);
        return LegalCaseResponse.fromEntity(legalCase);
    }

    @Transactional
    public LegalCaseResponse createCase(CreateLegalCaseRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        validateProjectTenant(request.projectId(), organizationId);
        validateContractTenant(request.contractId(), organizationId);
        validateUserTenant(request.responsibleId(), organizationId);
        validateUserTenant(request.lawyerId(), organizationId);

        LegalCase legalCase = LegalCase.builder()
                .organizationId(organizationId)
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
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        LegalCase legalCase = getCaseOrThrow(id, organizationId);

        if (request.caseNumber() != null) legalCase.setCaseNumber(request.caseNumber());
        if (request.projectId() != null) {
            validateProjectTenant(request.projectId(), organizationId);
            legalCase.setProjectId(request.projectId());
        }
        if (request.contractId() != null) {
            validateContractTenant(request.contractId(), organizationId);
            legalCase.setContractId(request.contractId());
        }
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
        if (request.responsibleId() != null) {
            validateUserTenant(request.responsibleId(), organizationId);
            legalCase.setResponsibleId(request.responsibleId());
        }
        if (request.lawyerId() != null) {
            validateUserTenant(request.lawyerId(), organizationId);
            legalCase.setLawyerId(request.lawyerId());
        }
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
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        LegalCase legalCase = getCaseOrThrow(id, organizationId);
        legalCase.softDelete();
        caseRepository.save(legalCase);
        auditService.logDelete("LegalCase", id);
        log.info("Legal case deleted: {} ({})", legalCase.getCaseNumber(), id);
    }

    @Transactional(readOnly = true)
    public LegalDashboardResponse getDashboard() {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        Map<String, Long> statusCounts = new HashMap<>();
        List<Object[]> statusData = caseRepository.countByStatusAndOrganizationId(organizationId);
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

        BigDecimal activeAmount = caseRepository.sumActiveClaimsAmountByOrganizationId(organizationId);

        return new LegalDashboardResponse(total, statusCounts,
                activeAmount != null ? activeAmount : BigDecimal.ZERO, open, closed);
    }

    @Transactional(readOnly = true)
    public List<LegalCaseResponse> getUpcomingHearings(int days) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        LocalDate from = LocalDate.now();
        LocalDate to = from.plusDays(days);
        return caseRepository.findUpcomingHearingsByOrganizationId(organizationId, from, to)
                .stream()
                .map(LegalCaseResponse::fromEntity)
                .toList();
    }

    // ===================== Decisions =====================

    @Transactional(readOnly = true)
    public List<LegalDecisionResponse> getCaseDecisions(UUID caseId) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        getCaseOrThrow(caseId, organizationId);
        return decisionRepository.findByCaseIdAndDeletedFalseOrderByDecisionDateDesc(caseId)
                .stream()
                .map(LegalDecisionResponse::fromEntity)
                .toList();
    }

    @Transactional
    public LegalDecisionResponse createDecision(CreateLegalDecisionRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        getCaseOrThrow(request.caseId(), organizationId);

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
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        LegalDecision decision = decisionRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Судебное решение не найдено: " + id));
        getCaseOrThrow(decision.getCaseId(), organizationId);

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
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        LegalDecision decision = decisionRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Судебное решение не найдено: " + id));
        getCaseOrThrow(decision.getCaseId(), organizationId);

        decision.softDelete();
        decisionRepository.save(decision);
        auditService.logDelete("LegalDecision", id);
        log.info("Legal decision deleted: {}", id);
    }

    // ===================== Remarks =====================

    @Transactional(readOnly = true)
    public List<LegalRemarkResponse> getCaseRemarks(UUID caseId, boolean includeConfidential) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        getCaseOrThrow(caseId, organizationId);
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
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        UUID currentUserId = SecurityUtils.requireCurrentUserId();
        getCaseOrThrow(request.caseId(), organizationId);
        validateUserTenant(currentUserId, organizationId);

        LegalRemark remark = LegalRemark.builder()
                .caseId(request.caseId())
                .authorId(currentUserId)
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
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        LegalRemark remark = remarkRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Замечание не найдено: " + id));
        getCaseOrThrow(remark.getCaseId(), organizationId);

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
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        LegalRemark remark = remarkRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Замечание не найдено: " + id));
        getCaseOrThrow(remark.getCaseId(), organizationId);

        remark.softDelete();
        remarkRepository.save(remark);
        auditService.logDelete("LegalRemark", id);
        log.info("Legal remark deleted: {}", id);
    }

    // ===================== Templates =====================

    @Transactional(readOnly = true)
    public Page<ContractLegalTemplateResponse> listTemplates(String search, LegalTemplateType type,
                                                              Pageable pageable) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        if (search != null && !search.isBlank()) {
            return templateRepository.searchByOrganizationId(search, organizationId, pageable)
                    .map(ContractLegalTemplateResponse::fromEntity);
        }
        if (type != null) {
            return templateRepository.findByOrganizationIdAndTemplateTypeAndActiveTrueAndDeletedFalse(organizationId, type)
                    .stream()
                    .map(ContractLegalTemplateResponse::fromEntity)
                    .collect(java.util.stream.Collectors.collectingAndThen(
                            java.util.stream.Collectors.toList(),
                            list -> new org.springframework.data.domain.PageImpl<>(list, pageable, list.size())
                    ));
        }
        return templateRepository.findByOrganizationIdAndActiveTrueAndDeletedFalse(organizationId, pageable)
                .map(ContractLegalTemplateResponse::fromEntity);
    }

    @Transactional
    public ContractLegalTemplateResponse createTemplate(CreateLegalTemplateRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        ContractLegalTemplate template = ContractLegalTemplate.builder()
                .organizationId(organizationId)
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
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        ContractLegalTemplate template = getTemplateOrThrow(id, organizationId);

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
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        ContractLegalTemplate template = getTemplateOrThrow(id, organizationId);

        template.softDelete();
        templateRepository.save(template);
        auditService.logDelete("ContractLegalTemplate", id);
        log.info("Legal template deleted: {}", id);
    }

    // ===================== Helpers =====================

    private LegalCase getCaseOrThrow(UUID id, UUID organizationId) {
        return caseRepository.findByIdAndOrganizationIdAndDeletedFalse(id, organizationId)
                .orElseThrow(() -> new EntityNotFoundException("Юридическое дело не найдено: " + id));
    }

    private ContractLegalTemplate getTemplateOrThrow(UUID id, UUID organizationId) {
        return templateRepository.findByIdAndOrganizationIdAndDeletedFalse(id, organizationId)
                .orElseThrow(() -> new EntityNotFoundException("Шаблон не найден: " + id));
    }

    private void validateUserTenant(UUID userId, UUID organizationId) {
        if (userId == null) {
            return;
        }
        User user = userRepository.findByIdAndOrganizationIdAndDeletedFalse(userId, organizationId)
                .orElseThrow(() -> new EntityNotFoundException("Пользователь не найден: " + userId));
        if (user.getOrganizationId() == null || !organizationId.equals(user.getOrganizationId())) {
            throw new EntityNotFoundException("Пользователь не найден: " + userId);
        }
    }

    private void validateProjectTenant(UUID projectId, UUID organizationId) {
        if (projectId == null) {
            return;
        }
        Project project = projectRepository.findById(projectId)
                .filter(p -> !p.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Проект не найден: " + projectId));
        if (project.getOrganizationId() == null || !organizationId.equals(project.getOrganizationId())) {
            throw new EntityNotFoundException("Проект не найден: " + projectId);
        }
    }

    private void validateContractTenant(UUID contractId, UUID organizationId) {
        if (contractId == null) {
            return;
        }
        Contract contract = contractRepository.findByIdAndOrganizationIdAndDeletedFalse(contractId, organizationId)
                .orElseThrow(() -> new EntityNotFoundException("Договор не найден: " + contractId));
        if (contract.getOrganizationId() == null || !organizationId.equals(contract.getOrganizationId())) {
            throw new EntityNotFoundException("Договор не найден: " + contractId);
        }
    }
}
