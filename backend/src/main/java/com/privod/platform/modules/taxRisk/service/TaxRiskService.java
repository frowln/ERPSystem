package com.privod.platform.modules.taxRisk.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.taxRisk.domain.AssessmentStatus;
import com.privod.platform.modules.taxRisk.domain.RiskLevel;
import com.privod.platform.modules.taxRisk.domain.TaxRiskAssessment;
import com.privod.platform.modules.taxRisk.domain.TaxRiskFactor;
import com.privod.platform.modules.taxRisk.domain.TaxRiskMitigation;
import com.privod.platform.modules.taxRisk.repository.TaxRiskAssessmentRepository;
import com.privod.platform.modules.taxRisk.repository.TaxRiskFactorRepository;
import com.privod.platform.modules.taxRisk.repository.TaxRiskMitigationRepository;
import com.privod.platform.modules.taxRisk.web.dto.CreateTaxRiskAssessmentRequest;
import com.privod.platform.modules.taxRisk.web.dto.CreateTaxRiskFactorRequest;
import com.privod.platform.modules.taxRisk.web.dto.CreateTaxRiskMitigationRequest;
import com.privod.platform.modules.taxRisk.web.dto.TaxRiskAssessmentResponse;
import com.privod.platform.modules.taxRisk.web.dto.TaxRiskFactorResponse;
import com.privod.platform.modules.taxRisk.web.dto.TaxRiskMitigationResponse;
import com.privod.platform.modules.taxRisk.web.dto.UpdateTaxRiskAssessmentRequest;
import com.privod.platform.modules.taxRisk.web.dto.UpdateTaxRiskFactorRequest;
import com.privod.platform.modules.taxRisk.web.dto.UpdateTaxRiskMitigationRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TaxRiskService {

    private final TaxRiskAssessmentRepository assessmentRepository;
    private final TaxRiskFactorRepository factorRepository;
    private final TaxRiskMitigationRepository mitigationRepository;
    private final AuditService auditService;

    // ---- Assessment CRUD ----

    @Transactional(readOnly = true)
    public Page<TaxRiskAssessmentResponse> listAssessments(AssessmentStatus status, RiskLevel riskLevel,
                                                            Pageable pageable) {
        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();
        if (status != null) {
            return assessmentRepository.findByOrganizationIdAndStatusAndDeletedFalse(currentOrgId, status, pageable)
                    .map(TaxRiskAssessmentResponse::fromEntity);
        }
        if (riskLevel != null) {
            return assessmentRepository.findByOrganizationIdAndRiskLevelAndDeletedFalse(currentOrgId, riskLevel, pageable)
                    .map(TaxRiskAssessmentResponse::fromEntity);
        }
        return assessmentRepository.findByOrganizationIdAndDeletedFalse(currentOrgId, pageable)
                .map(TaxRiskAssessmentResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public TaxRiskAssessmentResponse getAssessment(UUID id) {
        TaxRiskAssessment assessment = getAssessmentOrThrow(id);
        return TaxRiskAssessmentResponse.fromEntity(assessment);
    }

    @Transactional
    public TaxRiskAssessmentResponse createAssessment(CreateTaxRiskAssessmentRequest request) {
        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();
        if (request.organizationId() != null && !request.organizationId().equals(currentOrgId)) {
            throw new AccessDeniedException("Cannot create tax risk assessment in another organization");
        }

        if (request.code() != null && assessmentRepository.existsByCodeAndDeletedFalse(request.code())) {
            throw new IllegalArgumentException("Оценка с кодом '" + request.code() + "' уже существует");
        }

        TaxRiskAssessment assessment = TaxRiskAssessment.builder()
                .name(request.name())
                .code(request.code())
                .projectId(request.projectId())
                .organizationId(currentOrgId)
                .assessmentDate(request.assessmentDate())
                .assessor(request.assessor())
                .riskLevel(request.riskLevel())
                .status(AssessmentStatus.DRAFT)
                .overallScore(BigDecimal.ZERO)
                .description(request.description())
                .build();

        assessment = assessmentRepository.save(assessment);
        auditService.logCreate("TaxRiskAssessment", assessment.getId());

        log.info("Оценка налогового риска создана: {} - {} ({})",
                assessment.getCode(), assessment.getName(), assessment.getId());
        return TaxRiskAssessmentResponse.fromEntity(assessment);
    }

    @Transactional
    public TaxRiskAssessmentResponse updateAssessment(UUID id, UpdateTaxRiskAssessmentRequest request) {
        TaxRiskAssessment assessment = getAssessmentOrThrow(id);
        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();

        if (request.name() != null) {
            assessment.setName(request.name());
        }
        if (request.projectId() != null) {
            assessment.setProjectId(request.projectId());
        }
        if (request.organizationId() != null && !request.organizationId().equals(currentOrgId)) {
            throw new AccessDeniedException("Cannot move tax risk assessment to another organization");
        }
        if (request.assessmentDate() != null) {
            assessment.setAssessmentDate(request.assessmentDate());
        }
        if (request.assessor() != null) {
            assessment.setAssessor(request.assessor());
        }
        if (request.riskLevel() != null) {
            assessment.setRiskLevel(request.riskLevel());
        }
        if (request.status() != null) {
            AssessmentStatus oldStatus = assessment.getStatus();
            if (!assessment.canTransitionTo(request.status())) {
                throw new IllegalStateException(
                        String.format("Невозможно перевести оценку из статуса %s в %s",
                                oldStatus.getDisplayName(), request.status().getDisplayName()));
            }
            assessment.setStatus(request.status());
            auditService.logStatusChange("TaxRiskAssessment", assessment.getId(),
                    oldStatus.name(), request.status().name());
        }
        if (request.description() != null) {
            assessment.setDescription(request.description());
        }

        assessment = assessmentRepository.save(assessment);
        auditService.logUpdate("TaxRiskAssessment", assessment.getId(), "multiple", null, null);

        log.info("Оценка налогового риска обновлена: {} ({})", assessment.getCode(), assessment.getId());
        return TaxRiskAssessmentResponse.fromEntity(assessment);
    }

    @Transactional
    public void deleteAssessment(UUID id) {
        TaxRiskAssessment assessment = getAssessmentOrThrow(id);
        assessment.softDelete();
        assessmentRepository.save(assessment);
        auditService.logDelete("TaxRiskAssessment", assessment.getId());

        log.info("Оценка налогового риска удалена: {} ({})", assessment.getCode(), assessment.getId());
    }

    @Transactional(readOnly = true)
    public List<TaxRiskAssessmentResponse> getByProject(UUID projectId) {
        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();
        return assessmentRepository.findByProjectIdAndOrganizationIdAndDeletedFalse(projectId, currentOrgId).stream()
                .map(TaxRiskAssessmentResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TaxRiskAssessmentResponse> getByOrganization(UUID organizationId) {
        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();
        if (organizationId != null && !organizationId.equals(currentOrgId)) {
            throw new AccessDeniedException("Cannot access assessments for another organization");
        }
        return assessmentRepository.findByOrganizationIdAndDeletedFalse(currentOrgId).stream()
                .map(TaxRiskAssessmentResponse::fromEntity)
                .toList();
    }

    // ---- Factor CRUD ----

    @Transactional(readOnly = true)
    public List<TaxRiskFactorResponse> listFactors(UUID assessmentId) {
        getAssessmentOrThrow(assessmentId);
        return factorRepository.findByAssessmentIdAndDeletedFalse(assessmentId).stream()
                .map(TaxRiskFactorResponse::fromEntity)
                .toList();
    }

    @Transactional
    public TaxRiskFactorResponse addFactor(UUID assessmentId, CreateTaxRiskFactorRequest request) {
        getAssessmentOrThrow(assessmentId);

        BigDecimal weight = request.weight() != null ? request.weight() : BigDecimal.ONE;
        BigDecimal score = request.score() != null ? request.score() : BigDecimal.ZERO;
        BigDecimal weightedScore = weight.multiply(score).setScale(2, RoundingMode.HALF_UP);

        TaxRiskFactor factor = TaxRiskFactor.builder()
                .assessmentId(assessmentId)
                .factorName(request.factorName())
                .factorCategory(request.factorCategory())
                .weight(weight)
                .score(score)
                .weightedScore(weightedScore)
                .description(request.description())
                .recommendation(request.recommendation())
                .evidence(request.evidence())
                .build();

        factor = factorRepository.save(factor);
        auditService.logCreate("TaxRiskFactor", factor.getId());

        log.info("Фактор налогового риска добавлен: {} для оценки {} ({})",
                factor.getFactorName(), assessmentId, factor.getId());
        return TaxRiskFactorResponse.fromEntity(factor);
    }

    @Transactional
    public TaxRiskFactorResponse updateFactor(UUID assessmentId, UUID factorId,
                                               UpdateTaxRiskFactorRequest request) {
        getAssessmentOrThrow(assessmentId);
        TaxRiskFactor factor = getFactorOrThrow(factorId);

        if (!factor.getAssessmentId().equals(assessmentId)) {
            throw new IllegalArgumentException("Фактор не принадлежит указанной оценке");
        }

        if (request.factorName() != null) {
            factor.setFactorName(request.factorName());
        }
        if (request.factorCategory() != null) {
            factor.setFactorCategory(request.factorCategory());
        }
        if (request.weight() != null) {
            factor.setWeight(request.weight());
        }
        if (request.score() != null) {
            factor.setScore(request.score());
        }
        if (request.description() != null) {
            factor.setDescription(request.description());
        }
        if (request.recommendation() != null) {
            factor.setRecommendation(request.recommendation());
        }
        if (request.evidence() != null) {
            factor.setEvidence(request.evidence());
        }

        // Recalculate weighted score
        factor.setWeightedScore(factor.getWeight().multiply(factor.getScore())
                .setScale(2, RoundingMode.HALF_UP));

        factor = factorRepository.save(factor);
        auditService.logUpdate("TaxRiskFactor", factor.getId(), "multiple", null, null);

        log.info("Фактор налогового риска обновлён: {} ({})", factor.getFactorName(), factor.getId());
        return TaxRiskFactorResponse.fromEntity(factor);
    }

    @Transactional
    public void deleteFactor(UUID assessmentId, UUID factorId) {
        getAssessmentOrThrow(assessmentId);
        TaxRiskFactor factor = getFactorOrThrow(factorId);

        if (!factor.getAssessmentId().equals(assessmentId)) {
            throw new IllegalArgumentException("Фактор не принадлежит указанной оценке");
        }

        factor.softDelete();
        factorRepository.save(factor);
        auditService.logDelete("TaxRiskFactor", factor.getId());

        log.info("Фактор налогового риска удалён: {} ({})", factor.getFactorName(), factor.getId());
    }

    // ---- Mitigation CRUD ----

    @Transactional(readOnly = true)
    public List<TaxRiskMitigationResponse> listMitigations(UUID assessmentId) {
        getAssessmentOrThrow(assessmentId);
        return mitigationRepository.findByAssessmentIdAndDeletedFalse(assessmentId).stream()
                .map(TaxRiskMitigationResponse::fromEntity)
                .toList();
    }

    @Transactional
    public TaxRiskMitigationResponse addMitigation(UUID assessmentId,
                                                     CreateTaxRiskMitigationRequest request) {
        getAssessmentOrThrow(assessmentId);

        if (request.factorId() != null) {
            getFactorOrThrow(request.factorId());
        }

        TaxRiskMitigation mitigation = TaxRiskMitigation.builder()
                .assessmentId(assessmentId)
                .factorId(request.factorId())
                .action(request.action())
                .responsible(request.responsible())
                .deadline(request.deadline())
                .status(com.privod.platform.modules.taxRisk.domain.MitigationStatus.PLANNED)
                .result(request.result())
                .build();

        mitigation = mitigationRepository.save(mitigation);
        auditService.logCreate("TaxRiskMitigation", mitigation.getId());

        log.info("Мера по снижению налогового риска добавлена: {} для оценки {} ({})",
                mitigation.getAction(), assessmentId, mitigation.getId());
        return TaxRiskMitigationResponse.fromEntity(mitigation);
    }

    @Transactional
    public TaxRiskMitigationResponse updateMitigation(UUID assessmentId, UUID mitigationId,
                                                        UpdateTaxRiskMitigationRequest request) {
        getAssessmentOrThrow(assessmentId);
        TaxRiskMitigation mitigation = getMitigationOrThrow(mitigationId);

        if (!mitigation.getAssessmentId().equals(assessmentId)) {
            throw new IllegalArgumentException("Мера не принадлежит указанной оценке");
        }

        if (request.factorId() != null) {
            mitigation.setFactorId(request.factorId());
        }
        if (request.action() != null) {
            mitigation.setAction(request.action());
        }
        if (request.responsible() != null) {
            mitigation.setResponsible(request.responsible());
        }
        if (request.deadline() != null) {
            mitigation.setDeadline(request.deadline());
        }
        if (request.status() != null) {
            mitigation.setStatus(request.status());
        }
        if (request.result() != null) {
            mitigation.setResult(request.result());
        }

        mitigation = mitigationRepository.save(mitigation);
        auditService.logUpdate("TaxRiskMitigation", mitigation.getId(), "multiple", null, null);

        log.info("Мера по снижению налогового риска обновлена: {} ({})",
                mitigation.getAction(), mitigation.getId());
        return TaxRiskMitigationResponse.fromEntity(mitigation);
    }

    @Transactional
    public void deleteMitigation(UUID assessmentId, UUID mitigationId) {
        getAssessmentOrThrow(assessmentId);
        TaxRiskMitigation mitigation = getMitigationOrThrow(mitigationId);

        if (!mitigation.getAssessmentId().equals(assessmentId)) {
            throw new IllegalArgumentException("Мера не принадлежит указанной оценке");
        }

        mitigation.softDelete();
        mitigationRepository.save(mitigation);
        auditService.logDelete("TaxRiskMitigation", mitigation.getId());

        log.info("Мера по снижению налогового риска удалена: {} ({})",
                mitigation.getAction(), mitigation.getId());
    }

    // ---- Calculate overall score ----

    @Transactional
    public TaxRiskAssessmentResponse calculateOverallScore(UUID assessmentId) {
        TaxRiskAssessment assessment = getAssessmentOrThrow(assessmentId);

        BigDecimal totalWeightedScore = factorRepository.sumWeightedScoreByAssessmentId(assessmentId);
        BigDecimal totalWeight = factorRepository.sumWeightByAssessmentId(assessmentId);

        BigDecimal overallScore;
        if (totalWeight.compareTo(BigDecimal.ZERO) > 0) {
            overallScore = totalWeightedScore.divide(totalWeight, 2, RoundingMode.HALF_UP);
        } else {
            overallScore = BigDecimal.ZERO;
        }

        // Clamp to 0-100
        if (overallScore.compareTo(BigDecimal.ZERO) < 0) {
            overallScore = BigDecimal.ZERO;
        }
        if (overallScore.compareTo(new BigDecimal("100")) > 0) {
            overallScore = new BigDecimal("100.00");
        }

        assessment.setOverallScore(overallScore);

        // Auto-determine risk level based on score
        if (overallScore.compareTo(new BigDecimal("25")) <= 0) {
            assessment.setRiskLevel(RiskLevel.LOW);
        } else if (overallScore.compareTo(new BigDecimal("50")) <= 0) {
            assessment.setRiskLevel(RiskLevel.MEDIUM);
        } else if (overallScore.compareTo(new BigDecimal("75")) <= 0) {
            assessment.setRiskLevel(RiskLevel.HIGH);
        } else {
            assessment.setRiskLevel(RiskLevel.CRITICAL);
        }

        assessment = assessmentRepository.save(assessment);
        auditService.logUpdate("TaxRiskAssessment", assessment.getId(),
                "overallScore", null, overallScore.toPlainString());

        log.info("Общая оценка налогового риска пересчитана: {} = {} (уровень: {}) ({})",
                assessment.getCode(), overallScore, assessment.getRiskLevel(), assessment.getId());
        return TaxRiskAssessmentResponse.fromEntity(assessment);
    }

    // ---- Private helpers ----

    private TaxRiskAssessment getAssessmentOrThrow(UUID id) {
        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();
        return assessmentRepository.findByIdAndOrganizationIdAndDeletedFalse(id, currentOrgId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Оценка налогового риска не найдена: " + id));
    }

    private TaxRiskFactor getFactorOrThrow(UUID id) {
        return factorRepository.findById(id)
                .filter(f -> !f.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Фактор налогового риска не найден: " + id));
    }

    private TaxRiskMitigation getMitigationOrThrow(UUID id) {
        return mitigationRepository.findById(id)
                .filter(m -> !m.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Мера по снижению налогового риска не найдена: " + id));
    }
}
