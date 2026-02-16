package com.privod.platform.modules.contract.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.contract.domain.ContractType;
import com.privod.platform.modules.contract.repository.ContractTypeRepository;
import com.privod.platform.modules.contract.web.dto.ContractTypeResponse;
import com.privod.platform.modules.contract.web.dto.CreateContractTypeRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ContractTypeService {

    private final ContractTypeRepository contractTypeRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public List<ContractTypeResponse> listTypes() {
        return contractTypeRepository.findAllByActiveTrueOrderBySequenceAsc()
                .stream()
                .map(ContractTypeResponse::fromEntity)
                .toList();
    }

    @Transactional
    public ContractTypeResponse createType(CreateContractTypeRequest request) {
        if (contractTypeRepository.findByCode(request.code()).isPresent()) {
            throw new IllegalArgumentException("Тип договора с кодом " + request.code() + " уже существует");
        }

        ContractType type = ContractType.builder()
                .code(request.code())
                .name(request.name())
                .description(request.description())
                .sequence(request.sequence() != null ? request.sequence() : 0)
                .active(request.active() != null ? request.active() : true)
                .requiresLawyerApproval(request.requiresLawyerApproval() != null ? request.requiresLawyerApproval() : true)
                .requiresManagementApproval(request.requiresManagementApproval() != null ? request.requiresManagementApproval() : true)
                .requiresFinanceApproval(request.requiresFinanceApproval() != null ? request.requiresFinanceApproval() : true)
                .build();

        type = contractTypeRepository.save(type);
        auditService.logCreate("ContractType", type.getId());

        log.info("Contract type created: {} - {} ({})", type.getCode(), type.getName(), type.getId());
        return ContractTypeResponse.fromEntity(type);
    }

    @Transactional
    public ContractTypeResponse updateType(UUID id, CreateContractTypeRequest request) {
        ContractType type = contractTypeRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Тип договора не найден: " + id));

        if (request.code() != null) {
            type.setCode(request.code());
        }
        if (request.name() != null) {
            type.setName(request.name());
        }
        if (request.description() != null) {
            type.setDescription(request.description());
        }
        if (request.sequence() != null) {
            type.setSequence(request.sequence());
        }
        if (request.active() != null) {
            type.setActive(request.active());
        }
        if (request.requiresLawyerApproval() != null) {
            type.setRequiresLawyerApproval(request.requiresLawyerApproval());
        }
        if (request.requiresManagementApproval() != null) {
            type.setRequiresManagementApproval(request.requiresManagementApproval());
        }
        if (request.requiresFinanceApproval() != null) {
            type.setRequiresFinanceApproval(request.requiresFinanceApproval());
        }

        type = contractTypeRepository.save(type);
        auditService.logUpdate("ContractType", type.getId(), "multiple", null, null);

        log.info("Contract type updated: {} ({})", type.getCode(), type.getId());
        return ContractTypeResponse.fromEntity(type);
    }
}
