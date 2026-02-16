package com.privod.platform.modules.quality.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.quality.domain.ToleranceCategory;
import com.privod.platform.modules.quality.domain.ToleranceCheck;
import com.privod.platform.modules.quality.domain.ToleranceCheckStatus;
import com.privod.platform.modules.quality.domain.ToleranceRule;
import com.privod.platform.modules.quality.repository.ToleranceCheckRepository;
import com.privod.platform.modules.quality.repository.ToleranceRuleRepository;
import com.privod.platform.modules.quality.web.dto.CreateToleranceCheckRequest;
import com.privod.platform.modules.quality.web.dto.CreateToleranceRuleRequest;
import com.privod.platform.modules.quality.web.dto.ToleranceCheckResponse;
import com.privod.platform.modules.quality.web.dto.ToleranceRuleResponse;
import com.privod.platform.modules.quality.web.dto.UpdateToleranceRuleRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ToleranceService {

    private final ToleranceRuleRepository ruleRepository;
    private final ToleranceCheckRepository checkRepository;
    private final AuditService auditService;

    // --- Tolerance Rules ---

    @Transactional(readOnly = true)
    public Page<ToleranceRuleResponse> listRules(ToleranceCategory category, Pageable pageable) {
        if (category != null) {
            return ruleRepository.findByCategoryAndDeletedFalse(category, pageable)
                    .map(ToleranceRuleResponse::fromEntity);
        }
        return ruleRepository.findByDeletedFalse(pageable)
                .map(ToleranceRuleResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public ToleranceRuleResponse getRule(UUID id) {
        ToleranceRule rule = getRuleOrThrow(id);
        return ToleranceRuleResponse.fromEntity(rule);
    }

    @Transactional
    public ToleranceRuleResponse createRule(CreateToleranceRuleRequest request) {
        ToleranceRule rule = ToleranceRule.builder()
                .name(request.name())
                .code(request.code())
                .category(request.category())
                .parameterName(request.parameterName())
                .nominalValue(request.nominalValue())
                .minValue(request.minValue())
                .maxValue(request.maxValue())
                .unit(request.unit())
                .standardReference(request.standardReference())
                .isActive(true)
                .build();

        rule = ruleRepository.save(rule);
        auditService.logCreate("ToleranceRule", rule.getId());

        log.info("Tolerance rule created: {} - {} ({})", rule.getCode(), rule.getName(), rule.getId());
        return ToleranceRuleResponse.fromEntity(rule);
    }

    @Transactional
    public ToleranceRuleResponse updateRule(UUID id, UpdateToleranceRuleRequest request) {
        ToleranceRule rule = getRuleOrThrow(id);

        if (request.name() != null) {
            rule.setName(request.name());
        }
        if (request.category() != null) {
            rule.setCategory(request.category());
        }
        if (request.parameterName() != null) {
            rule.setParameterName(request.parameterName());
        }
        if (request.nominalValue() != null) {
            rule.setNominalValue(request.nominalValue());
        }
        if (request.minValue() != null) {
            rule.setMinValue(request.minValue());
        }
        if (request.maxValue() != null) {
            rule.setMaxValue(request.maxValue());
        }
        if (request.unit() != null) {
            rule.setUnit(request.unit());
        }
        if (request.standardReference() != null) {
            rule.setStandardReference(request.standardReference());
        }
        if (request.isActive() != null) {
            rule.setActive(request.isActive());
        }

        rule = ruleRepository.save(rule);
        auditService.logUpdate("ToleranceRule", rule.getId(), "multiple", null, null);

        log.info("Tolerance rule updated: {} ({})", rule.getName(), rule.getId());
        return ToleranceRuleResponse.fromEntity(rule);
    }

    @Transactional
    public void deleteRule(UUID id) {
        ToleranceRule rule = getRuleOrThrow(id);
        rule.softDelete();
        ruleRepository.save(rule);
        auditService.logDelete("ToleranceRule", rule.getId());

        log.info("Tolerance rule deleted: {} ({})", rule.getName(), id);
    }

    // --- Tolerance Checks ---

    @Transactional(readOnly = true)
    public Page<ToleranceCheckResponse> listChecks(UUID projectId, UUID toleranceRuleId, Pageable pageable) {
        if (projectId != null) {
            return checkRepository.findByProjectIdAndDeletedFalse(projectId, pageable)
                    .map(ToleranceCheckResponse::fromEntity);
        }
        if (toleranceRuleId != null) {
            return checkRepository.findByToleranceRuleIdAndDeletedFalse(toleranceRuleId, pageable)
                    .map(ToleranceCheckResponse::fromEntity);
        }
        return checkRepository.findByDeletedFalse(pageable)
                .map(ToleranceCheckResponse::fromEntity);
    }

    @Transactional
    public ToleranceCheckResponse performCheck(CreateToleranceCheckRequest request) {
        ToleranceRule rule = getRuleOrThrow(request.toleranceRuleId());

        BigDecimal measured = request.measuredValue();
        boolean withinTolerance = true;
        BigDecimal deviation = BigDecimal.ZERO;

        if (rule.getNominalValue() != null) {
            deviation = measured.subtract(rule.getNominalValue()).abs();
        }

        if (rule.getMinValue() != null && measured.compareTo(rule.getMinValue()) < 0) {
            withinTolerance = false;
        }
        if (rule.getMaxValue() != null && measured.compareTo(rule.getMaxValue()) > 0) {
            withinTolerance = false;
        }

        ToleranceCheckStatus status = withinTolerance ? ToleranceCheckStatus.PASS : ToleranceCheckStatus.FAIL;

        ToleranceCheck check = ToleranceCheck.builder()
                .toleranceRuleId(request.toleranceRuleId())
                .projectId(request.projectId())
                .location(request.location())
                .measuredValue(measured)
                .isWithinTolerance(withinTolerance)
                .deviation(deviation)
                .checkedById(request.checkedById())
                .checkedAt(LocalDateTime.now())
                .notes(request.notes())
                .status(status)
                .build();

        check = checkRepository.save(check);
        auditService.logCreate("ToleranceCheck", check.getId());

        log.info("Tolerance check performed: rule {} on project {} - {} ({})",
                rule.getCode(), request.projectId(), status, check.getId());
        return ToleranceCheckResponse.fromEntity(check);
    }

    @Transactional(readOnly = true)
    public List<ToleranceCheckResponse> getFailedChecks(UUID projectId) {
        return checkRepository.findByProjectIdAndIsWithinToleranceFalseAndDeletedFalse(projectId)
                .stream()
                .map(ToleranceCheckResponse::fromEntity)
                .toList();
    }

    @Transactional
    public ToleranceCheckResponse markForRecheck(UUID checkId) {
        ToleranceCheck check = checkRepository.findById(checkId)
                .filter(c -> !c.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Проверка допуска не найдена: " + checkId));

        String oldStatus = check.getStatus().name();
        check.setStatus(ToleranceCheckStatus.NEEDS_RECHECK);
        check = checkRepository.save(check);
        auditService.logUpdate("ToleranceCheck", check.getId(), "status", oldStatus, "NEEDS_RECHECK");

        log.info("Tolerance check marked for recheck: {}", checkId);
        return ToleranceCheckResponse.fromEntity(check);
    }

    private ToleranceRule getRuleOrThrow(UUID id) {
        return ruleRepository.findById(id)
                .filter(r -> !r.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Правило допуска не найдено: " + id));
    }
}
