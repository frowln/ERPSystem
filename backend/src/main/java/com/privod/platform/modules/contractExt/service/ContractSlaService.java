package com.privod.platform.modules.contractExt.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.contractExt.domain.ContractSla;
import com.privod.platform.modules.contractExt.domain.SlaViolation;
import com.privod.platform.modules.contractExt.domain.ViolationStatus;
import com.privod.platform.modules.contractExt.repository.ContractSlaRepository;
import com.privod.platform.modules.contractExt.repository.SlaViolationRepository;
import com.privod.platform.modules.contractExt.web.dto.ContractSlaResponse;
import com.privod.platform.modules.contractExt.web.dto.CreateSlaRequest;
import com.privod.platform.modules.contractExt.web.dto.CreateSlaViolationRequest;
import com.privod.platform.modules.contractExt.web.dto.SlaViolationResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ContractSlaService {

    private final ContractSlaRepository slaRepository;
    private final SlaViolationRepository violationRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<ContractSlaResponse> listByContract(UUID contractId, Pageable pageable) {
        return slaRepository.findByContractIdAndDeletedFalse(contractId, pageable)
                .map(ContractSlaResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public ContractSlaResponse getById(UUID id) {
        ContractSla sla = getSlaOrThrow(id);
        return ContractSlaResponse.fromEntity(sla);
    }

    @Transactional
    public ContractSlaResponse create(CreateSlaRequest request) {
        ContractSla sla = ContractSla.builder()
                .contractId(request.contractId())
                .metric(request.metric())
                .targetValue(request.targetValue())
                .unit(request.unit())
                .measurementPeriod(request.measurementPeriod())
                .penaltyAmount(request.penaltyAmount())
                .penaltyType(request.penaltyType())
                .isActive(true)
                .build();

        sla = slaRepository.save(sla);
        auditService.logCreate("ContractSla", sla.getId());

        log.info("SLA created: {} for contract {}", sla.getMetric(), sla.getContractId());
        return ContractSlaResponse.fromEntity(sla);
    }

    @Transactional
    public ContractSlaResponse deactivate(UUID id) {
        ContractSla sla = getSlaOrThrow(id);
        sla.setActive(false);
        sla = slaRepository.save(sla);

        auditService.logUpdate("ContractSla", sla.getId(), "isActive", "true", "false");

        log.info("SLA deactivated: {} ({})", sla.getMetric(), sla.getId());
        return ContractSlaResponse.fromEntity(sla);
    }

    // -- Violations --

    @Transactional(readOnly = true)
    public Page<SlaViolationResponse> listViolations(UUID slaId, Pageable pageable) {
        return violationRepository.findBySlaIdAndDeletedFalse(slaId, pageable)
                .map(SlaViolationResponse::fromEntity);
    }

    @Transactional
    public SlaViolationResponse createViolation(CreateSlaViolationRequest request) {
        getSlaOrThrow(request.slaId());

        SlaViolation violation = SlaViolation.builder()
                .slaId(request.slaId())
                .violationDate(request.violationDate())
                .actualValue(request.actualValue())
                .penaltyAmount(request.penaltyAmount())
                .status(ViolationStatus.DETECTED)
                .build();

        violation = violationRepository.save(violation);
        auditService.logCreate("SlaViolation", violation.getId());

        log.info("SLA violation created for SLA {}: date {}", request.slaId(), request.violationDate());
        return SlaViolationResponse.fromEntity(violation);
    }

    @Transactional
    public SlaViolationResponse resolveViolation(UUID violationId) {
        SlaViolation violation = violationRepository.findById(violationId)
                .filter(v -> !v.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Нарушение SLA не найдено: " + violationId));

        ViolationStatus oldStatus = violation.getStatus();
        violation.setStatus(ViolationStatus.RESOLVED);
        violation.setResolvedAt(Instant.now());
        violation = violationRepository.save(violation);

        auditService.logStatusChange("SlaViolation", violation.getId(),
                oldStatus.name(), ViolationStatus.RESOLVED.name());

        log.info("SLA violation resolved: {}", violationId);
        return SlaViolationResponse.fromEntity(violation);
    }

    private ContractSla getSlaOrThrow(UUID id) {
        return slaRepository.findById(id)
                .filter(s -> !s.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("SLA не найден: " + id));
    }
}
