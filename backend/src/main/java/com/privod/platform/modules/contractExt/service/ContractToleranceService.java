package com.privod.platform.modules.contractExt.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.contractExt.domain.Tolerance;
import com.privod.platform.modules.quality.domain.ToleranceCheck;
import com.privod.platform.modules.contractExt.repository.ContractToleranceCheckRepository;
import com.privod.platform.modules.contractExt.repository.ToleranceRepository;
import com.privod.platform.modules.contractExt.web.dto.CreateToleranceCheckRequest;
import com.privod.platform.modules.contractExt.web.dto.CreateToleranceRequest;
import com.privod.platform.modules.contractExt.web.dto.ToleranceCheckResponse;
import com.privod.platform.modules.contractExt.web.dto.ToleranceResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ContractToleranceService {

    private final ToleranceRepository toleranceRepository;
    private final ContractToleranceCheckRepository checkRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<ToleranceResponse> listAll(Pageable pageable) {
        return toleranceRepository.findByDeletedFalse(pageable)
                .map(ToleranceResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public Page<ToleranceResponse> listByProject(UUID projectId, Pageable pageable) {
        return toleranceRepository.findByProjectIdAndDeletedFalse(projectId, pageable)
                .map(ToleranceResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public ToleranceResponse getById(UUID id) {
        Tolerance tolerance = getToleranceOrThrow(id);
        return ToleranceResponse.fromEntity(tolerance);
    }

    @Transactional
    public ToleranceResponse create(CreateToleranceRequest request) {
        Tolerance tolerance = Tolerance.builder()
                .projectId(request.projectId())
                .workType(request.workType())
                .parameter(request.parameter())
                .nominalValue(request.nominalValue())
                .unit(request.unit())
                .minDeviation(request.minDeviation())
                .maxDeviation(request.maxDeviation())
                .measurementMethod(request.measurementMethod())
                .referenceStandard(request.referenceStandard())
                .build();

        tolerance = toleranceRepository.save(tolerance);
        auditService.logCreate("Tolerance", tolerance.getId());

        log.info("Tolerance created: {} - {} ({})", tolerance.getWorkType(), tolerance.getParameter(), tolerance.getId());
        return ToleranceResponse.fromEntity(tolerance);
    }

    // -- Checks --

    @Transactional(readOnly = true)
    public Page<ToleranceCheckResponse> listChecks(UUID toleranceId, Pageable pageable) {
        return checkRepository.findByToleranceRuleIdAndDeletedFalse(toleranceId, pageable)
                .map(ToleranceCheckResponse::fromEntity);
    }

    @Transactional
    public ToleranceCheckResponse createCheck(CreateToleranceCheckRequest request) {
        Tolerance tolerance = getToleranceOrThrow(request.toleranceId());

        boolean withinTolerance = isWithinTolerance(tolerance, request.measuredValue());

        ToleranceCheck check = ToleranceCheck.builder()
                .toleranceRuleId(request.toleranceId())
                .projectId(tolerance.getProjectId())
                .measuredValue(request.measuredValue())
                .isWithinTolerance(withinTolerance)
                .checkedById(request.measuredById())
                .checkedAt(LocalDateTime.now())
                .location(request.location())
                .notes(request.notes())
                .build();

        check = checkRepository.save(check);
        auditService.logCreate("ToleranceCheck", check.getId());

        log.info("Tolerance check created: value {} within={} for tolerance {}",
                request.measuredValue(), withinTolerance, request.toleranceId());
        return ToleranceCheckResponse.fromEntity(check);
    }

    boolean isWithinTolerance(Tolerance tolerance, BigDecimal measuredValue) {
        BigDecimal deviation = measuredValue.subtract(tolerance.getNominalValue());
        return deviation.compareTo(tolerance.getMinDeviation()) >= 0
                && deviation.compareTo(tolerance.getMaxDeviation()) <= 0;
    }

    private Tolerance getToleranceOrThrow(UUID id) {
        return toleranceRepository.findById(id)
                .filter(t -> !t.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Допуск не найден: " + id));
    }
}
