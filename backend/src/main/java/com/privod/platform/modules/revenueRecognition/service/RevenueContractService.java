package com.privod.platform.modules.revenueRecognition.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.revenueRecognition.domain.RecognitionMethod;
import com.privod.platform.modules.revenueRecognition.domain.RecognitionStandard;
import com.privod.platform.modules.revenueRecognition.domain.RevenueContract;
import com.privod.platform.modules.revenueRecognition.repository.RevenueContractRepository;
import com.privod.platform.modules.revenueRecognition.web.dto.CreateRevenueContractRequest;
import com.privod.platform.modules.revenueRecognition.web.dto.RevenueContractResponse;
import com.privod.platform.modules.revenueRecognition.web.dto.UpdateRevenueContractRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class RevenueContractService {

    private final RevenueContractRepository revenueContractRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<RevenueContractResponse> listContracts(UUID organizationId, UUID projectId,
                                                        RecognitionMethod method,
                                                        RecognitionStandard standard,
                                                        String search,
                                                        Pageable pageable) {
        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();
        if (organizationId != null && !organizationId.equals(currentOrgId)) {
            throw new AccessDeniedException("Cannot access revenue contracts for another organization");
        }

        Specification<RevenueContract> spec = Specification
                .where(RevenueContractSpecification.notDeleted())
                .and(RevenueContractSpecification.belongsToOrganization(currentOrgId))
                .and(RevenueContractSpecification.belongsToProject(projectId))
                .and(RevenueContractSpecification.hasMethod(method))
                .and(RevenueContractSpecification.hasStandard(standard))
                .and(RevenueContractSpecification.searchByContractName(search));

        return revenueContractRepository.findAll(spec, pageable)
                .map(RevenueContractResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public RevenueContractResponse getContract(UUID id) {
        RevenueContract contract = getContractOrThrow(id);
        return RevenueContractResponse.fromEntity(contract);
    }

    @Transactional
    public RevenueContractResponse createContract(CreateRevenueContractRequest request) {
        validateDates(request.startDate(), request.endDate());

        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();
        if (request.organizationId() != null && !request.organizationId().equals(currentOrgId)) {
            throw new AccessDeniedException("Cannot create revenue contract in another organization");
        }

        RecognitionMethod method = request.recognitionMethod() != null
                ? request.recognitionMethod() : RecognitionMethod.PERCENTAGE_OF_COMPLETION;
        RecognitionStandard standard = request.recognitionStandard() != null
                ? request.recognitionStandard() : RecognitionStandard.PBU_2_2008;

        RevenueContract contract = RevenueContract.builder()
                .projectId(request.projectId())
                .contractId(request.contractId())
                .contractName(request.contractName())
                .recognitionMethod(method)
                .recognitionStandard(standard)
                .totalContractRevenue(request.totalContractRevenue())
                .totalEstimatedCost(request.totalEstimatedCost())
                .organizationId(currentOrgId)
                .startDate(request.startDate())
                .endDate(request.endDate())
                .build();

        contract = revenueContractRepository.save(contract);
        auditService.logCreate("RevenueContract", contract.getId());

        log.info("RevenueContract created: {} for project {} ({})",
                contract.getContractName(), contract.getProjectId(), contract.getId());
        return RevenueContractResponse.fromEntity(contract);
    }

    @Transactional
    public RevenueContractResponse updateContract(UUID id, UpdateRevenueContractRequest request) {
        RevenueContract contract = getContractOrThrow(id);

        if (request.contractId() != null) {
            contract.setContractId(request.contractId());
        }
        if (request.contractName() != null) {
            contract.setContractName(request.contractName());
        }
        if (request.recognitionMethod() != null) {
            contract.setRecognitionMethod(request.recognitionMethod());
        }
        if (request.recognitionStandard() != null) {
            contract.setRecognitionStandard(request.recognitionStandard());
        }
        if (request.totalContractRevenue() != null) {
            contract.setTotalContractRevenue(request.totalContractRevenue());
        }
        if (request.totalEstimatedCost() != null) {
            contract.setTotalEstimatedCost(request.totalEstimatedCost());
        }
        if (request.startDate() != null) {
            contract.setStartDate(request.startDate());
        }
        if (request.endDate() != null) {
            contract.setEndDate(request.endDate());
        }
        if (request.isActive() != null) {
            contract.setIsActive(request.isActive());
        }

        validateDates(contract.getStartDate(), contract.getEndDate());

        contract = revenueContractRepository.save(contract);
        auditService.logUpdate("RevenueContract", contract.getId(), "multiple", null, null);

        log.info("RevenueContract updated: {} ({})", contract.getContractName(), contract.getId());
        return RevenueContractResponse.fromEntity(contract);
    }

    @Transactional
    public void deleteContract(UUID id) {
        RevenueContract contract = getContractOrThrow(id);
        contract.softDelete();
        revenueContractRepository.save(contract);
        auditService.logDelete("RevenueContract", id);
        log.info("RevenueContract soft-deleted: {}", id);
    }

    RevenueContract getContractOrThrow(UUID id) {
        RevenueContract contract = revenueContractRepository.findById(id)
                .filter(c -> !c.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Договор признания выручки не найден: " + id));

        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();
        if (contract.getOrganizationId() == null || !contract.getOrganizationId().equals(currentOrgId)) {
            // Avoid leaking cross-tenant existence.
            throw new EntityNotFoundException("Договор признания выручки не найден: " + id);
        }

        return contract;
    }

    private void validateDates(java.time.LocalDate start, java.time.LocalDate end) {
        if (start != null && end != null && end.isBefore(start)) {
            throw new IllegalArgumentException(
                    "Дата окончания должна быть позже даты начала");
        }
    }
}
