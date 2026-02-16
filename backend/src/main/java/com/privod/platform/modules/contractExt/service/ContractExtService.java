package com.privod.platform.modules.contractExt.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.contractExt.domain.ContractGuarantee;
import com.privod.platform.modules.contractExt.domain.ContractInsurance;
import com.privod.platform.modules.contractExt.domain.ContractMilestone;
import com.privod.platform.modules.contractExt.domain.GuaranteeStatus;
import com.privod.platform.modules.contractExt.domain.GuaranteeType;
import com.privod.platform.modules.contractExt.domain.InsuranceStatus;
import com.privod.platform.modules.contractExt.domain.MilestoneStatus;
import com.privod.platform.modules.contractExt.repository.ContractGuaranteeRepository;
import com.privod.platform.modules.contractExt.repository.ContractInsuranceRepository;
import com.privod.platform.modules.contractExt.repository.ContractMilestoneRepository;
import com.privod.platform.modules.contractExt.web.dto.ContractGuaranteeResponse;
import com.privod.platform.modules.contractExt.web.dto.ContractInsuranceResponse;
import com.privod.platform.modules.contractExt.web.dto.ContractMilestoneResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ContractExtService {

    private final ContractGuaranteeRepository guaranteeRepository;
    private final ContractMilestoneRepository milestoneRepository;
    private final ContractInsuranceRepository insuranceRepository;
    private final AuditService auditService;

    // --- Guarantees ---

    @Transactional(readOnly = true)
    public Page<ContractGuaranteeResponse> listGuarantees(UUID contractId, Pageable pageable) {
        return guaranteeRepository.findByContractIdAndDeletedFalse(contractId, pageable)
                .map(ContractGuaranteeResponse::fromEntity);
    }

    @Transactional
    public ContractGuaranteeResponse createGuarantee(UUID contractId, GuaranteeType guaranteeType,
                                                      BigDecimal amount, String currency,
                                                      String issuedBy, LocalDate issuedAt,
                                                      LocalDate expiresAt, String documentUrl) {
        ContractGuarantee guarantee = ContractGuarantee.builder()
                .contractId(contractId)
                .guaranteeType(guaranteeType)
                .amount(amount)
                .currency(currency != null ? currency : "RUB")
                .issuedBy(issuedBy)
                .issuedAt(issuedAt)
                .expiresAt(expiresAt)
                .status(GuaranteeStatus.ACTIVE)
                .documentUrl(documentUrl)
                .build();

        guarantee = guaranteeRepository.save(guarantee);
        auditService.logCreate("ContractGuarantee", guarantee.getId());

        log.info("Guarantee created: {} for contract {}", guaranteeType, contractId);
        return ContractGuaranteeResponse.fromEntity(guarantee);
    }

    // --- Milestones ---

    @Transactional(readOnly = true)
    public Page<ContractMilestoneResponse> listMilestones(UUID contractId, Pageable pageable) {
        return milestoneRepository.findByContractIdAndDeletedFalse(contractId, pageable)
                .map(ContractMilestoneResponse::fromEntity);
    }

    @Transactional
    public ContractMilestoneResponse createMilestone(UUID contractId, String name, String description,
                                                      LocalDate dueDate, String completionCriteria,
                                                      BigDecimal amount) {
        ContractMilestone milestone = ContractMilestone.builder()
                .contractId(contractId)
                .name(name)
                .description(description)
                .dueDate(dueDate)
                .completionCriteria(completionCriteria)
                .amount(amount)
                .status(MilestoneStatus.PENDING)
                .build();

        milestone = milestoneRepository.save(milestone);
        auditService.logCreate("ContractMilestone", milestone.getId());

        log.info("Milestone created: {} for contract {}", name, contractId);
        return ContractMilestoneResponse.fromEntity(milestone);
    }

    @Transactional
    public ContractMilestoneResponse completeMilestone(UUID id, String evidenceUrl) {
        ContractMilestone milestone = milestoneRepository.findById(id)
                .filter(m -> !m.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Веха не найдена: " + id));

        if (milestone.getStatus() == MilestoneStatus.COMPLETED) {
            throw new IllegalStateException("Веха уже выполнена");
        }

        MilestoneStatus oldStatus = milestone.getStatus();
        milestone.setStatus(MilestoneStatus.COMPLETED);
        milestone.setCompletedAt(Instant.now());
        milestone.setEvidenceUrl(evidenceUrl);
        milestone = milestoneRepository.save(milestone);

        auditService.logStatusChange("ContractMilestone", milestone.getId(),
                oldStatus.name(), MilestoneStatus.COMPLETED.name());

        log.info("Milestone completed: {} ({})", milestone.getName(), milestone.getId());
        return ContractMilestoneResponse.fromEntity(milestone);
    }

    // --- Insurance ---

    @Transactional(readOnly = true)
    public Page<ContractInsuranceResponse> listInsurances(UUID contractId, Pageable pageable) {
        return insuranceRepository.findByContractIdAndDeletedFalse(contractId, pageable)
                .map(ContractInsuranceResponse::fromEntity);
    }

    @Transactional
    public ContractInsuranceResponse createInsurance(UUID contractId, String policyNumber,
                                                      String insuranceType, String insurer,
                                                      BigDecimal coveredAmount, BigDecimal premiumAmount,
                                                      LocalDate startDate, LocalDate endDate,
                                                      String policyUrl) {
        if (endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("Дата окончания полиса должна быть позже даты начала");
        }

        ContractInsurance insurance = ContractInsurance.builder()
                .contractId(contractId)
                .policyNumber(policyNumber)
                .insuranceType(insuranceType)
                .insurer(insurer)
                .coveredAmount(coveredAmount)
                .premiumAmount(premiumAmount)
                .startDate(startDate)
                .endDate(endDate)
                .status(InsuranceStatus.ACTIVE)
                .policyUrl(policyUrl)
                .build();

        insurance = insuranceRepository.save(insurance);
        auditService.logCreate("ContractInsurance", insurance.getId());

        log.info("Insurance created: {} for contract {}", policyNumber, contractId);
        return ContractInsuranceResponse.fromEntity(insurance);
    }
}
