package com.privod.platform.modules.hrRussian.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.hrRussian.domain.ContractStatus;
import com.privod.platform.modules.hrRussian.domain.EmploymentContract;
import com.privod.platform.modules.hrRussian.repository.EmploymentContractRepository;
import com.privod.platform.modules.hrRussian.web.dto.CreateEmploymentContractRequest;
import com.privod.platform.modules.hrRussian.web.dto.EmploymentContractResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmploymentContractService {

    private final EmploymentContractRepository contractRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public List<EmploymentContractResponse> getByEmployee(UUID employeeId) {
        return contractRepository.findByEmployeeIdAndDeletedFalseOrderByStartDateDesc(employeeId)
                .stream()
                .map(EmploymentContractResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public EmploymentContractResponse getContract(UUID id) {
        EmploymentContract contract = getContractOrThrow(id);
        return EmploymentContractResponse.fromEntity(contract);
    }

    @Transactional
    public EmploymentContractResponse createContract(CreateEmploymentContractRequest request) {
        EmploymentContract contract = EmploymentContract.builder()
                .employeeId(request.employeeId())
                .contractNumber(request.contractNumber())
                .contractType(request.contractType())
                .startDate(request.startDate())
                .endDate(request.endDate())
                .salary(request.salary() != null ? request.salary() : BigDecimal.ZERO)
                .salaryType(request.salaryType())
                .position(request.position())
                .department(request.department())
                .probationEndDate(request.probationEndDate())
                .workSchedule(request.workSchedule())
                .status(ContractStatus.ACTIVE)
                .build();

        contract = contractRepository.save(contract);
        auditService.logCreate("EmploymentContract", contract.getId());

        log.info("Employment contract created: {} for employee {} ({})",
                contract.getContractNumber(), request.employeeId(), contract.getId());
        return EmploymentContractResponse.fromEntity(contract);
    }

    @Transactional
    public EmploymentContractResponse terminateContract(UUID id) {
        EmploymentContract contract = getContractOrThrow(id);

        if (contract.getStatus() != ContractStatus.ACTIVE) {
            throw new IllegalStateException("Расторгнуть можно только действующий договор");
        }

        ContractStatus oldStatus = contract.getStatus();
        contract.setStatus(ContractStatus.TERMINATED);
        contract = contractRepository.save(contract);
        auditService.logStatusChange("EmploymentContract", contract.getId(),
                oldStatus.name(), ContractStatus.TERMINATED.name());

        log.info("Employment contract terminated: {} ({})", contract.getContractNumber(), contract.getId());
        return EmploymentContractResponse.fromEntity(contract);
    }

    @Transactional
    public void deleteContract(UUID id) {
        EmploymentContract contract = getContractOrThrow(id);
        contract.softDelete();
        contractRepository.save(contract);
        auditService.logDelete("EmploymentContract", id);
        log.info("Employment contract soft-deleted: {}", id);
    }

    private EmploymentContract getContractOrThrow(UUID id) {
        return contractRepository.findById(id)
                .filter(c -> !c.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Трудовой договор не найден: " + id));
    }
}
