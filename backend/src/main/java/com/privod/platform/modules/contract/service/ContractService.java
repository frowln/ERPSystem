package com.privod.platform.modules.contract.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.contract.domain.ApprovalStatus;
import com.privod.platform.modules.contract.domain.Contract;
import com.privod.platform.modules.contract.domain.ContractApproval;
import com.privod.platform.modules.contract.domain.ContractStatus;
import com.privod.platform.modules.contract.domain.ContractType;
import com.privod.platform.modules.contract.repository.ContractApprovalRepository;
import com.privod.platform.modules.contract.repository.ContractRepository;
import com.privod.platform.modules.contract.repository.ContractTypeRepository;
import com.privod.platform.modules.contract.web.dto.ApproveContractRequest;
import com.privod.platform.modules.contract.web.dto.ChangeContractStatusRequest;
import com.privod.platform.modules.contract.web.dto.ContractDashboardResponse;
import com.privod.platform.modules.contract.web.dto.ContractResponse;
import com.privod.platform.modules.contract.web.dto.CreateContractRequest;
import com.privod.platform.modules.contract.web.dto.RejectContractRequest;
import com.privod.platform.modules.contract.web.dto.UpdateContractRequest;
import com.privod.platform.modules.project.domain.Project;
import com.privod.platform.modules.project.repository.ProjectRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ContractService {

    private final ContractRepository contractRepository;
    private final ContractTypeRepository contractTypeRepository;
    private final ContractApprovalRepository contractApprovalRepository;
    private final ProjectRepository projectRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<ContractResponse> listContracts(String search, ContractStatus status,
                                                 UUID projectId, UUID partnerId, Pageable pageable) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        validateProjectTenant(projectId, organizationId);

        Specification<Contract> spec = Specification.where(ContractSpecification.notDeleted())
                .and(ContractSpecification.belongsToOrganization(organizationId))
                .and(ContractSpecification.hasStatus(status))
                .and(ContractSpecification.belongsToProject(projectId))
                .and(ContractSpecification.hasPartner(partnerId))
                .and(ContractSpecification.searchByNameOrNumber(search));

        return contractRepository.findAll(spec, pageable).map(ContractResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public ContractResponse getContract(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        Contract contract = getContractOrThrow(id, organizationId);
        return ContractResponse.fromEntity(contract);
    }

    @Transactional
    public ContractResponse createContract(CreateContractRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        validateProjectTenant(request.projectId(), organizationId);
        validateDates(request.plannedStartDate(), request.plannedEndDate());

        String number = generateContractNumber();

        BigDecimal vatRate = request.vatRate() != null ? request.vatRate() : new BigDecimal("20.00");
        BigDecimal amount = request.amount() != null ? request.amount() : BigDecimal.ZERO;
        BigDecimal vatAmount = calculateVatAmount(amount, vatRate);
        BigDecimal totalWithVat = amount.add(vatAmount);

        Contract contract = Contract.builder()
                .organizationId(organizationId)
                .name(request.name())
                .number(number)
                .contractDate(request.contractDate())
                .partnerId(request.partnerId())
                .partnerName(request.partnerName())
                .projectId(request.projectId())
                .typeId(request.typeId())
                .status(ContractStatus.DRAFT)
                .amount(amount)
                .vatRate(vatRate)
                .vatAmount(vatAmount)
                .totalWithVat(totalWithVat)
                .paymentTerms(request.paymentTerms())
                .plannedStartDate(request.plannedStartDate())
                .plannedEndDate(request.plannedEndDate())
                .responsibleId(request.responsibleId())
                .retentionPercent(request.retentionPercent() != null ? request.retentionPercent() : BigDecimal.ZERO)
                .notes(request.notes())
                .build();

        contract = contractRepository.save(contract);
        auditService.logCreate("Contract", contract.getId());

        log.info("Contract created: {} - {} ({})", contract.getNumber(), contract.getName(), contract.getId());
        return ContractResponse.fromEntity(contract);
    }

    @Transactional
    public ContractResponse updateContract(UUID id, UpdateContractRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        Contract contract = getContractOrThrow(id, organizationId);

        if (contract.getStatus() != ContractStatus.DRAFT && contract.getStatus() != ContractStatus.REJECTED) {
            throw new IllegalStateException(
                    "Редактирование договора возможно только в статусе Черновик или Отклонён");
        }

        if (request.name() != null) {
            contract.setName(request.name());
        }
        if (request.contractDate() != null) {
            contract.setContractDate(request.contractDate());
        }
        if (request.partnerId() != null) {
            contract.setPartnerId(request.partnerId());
        }
        if (request.partnerName() != null) {
            contract.setPartnerName(request.partnerName());
        }
        if (request.projectId() != null) {
            validateProjectTenant(request.projectId(), organizationId);
            contract.setProjectId(request.projectId());
        }
        if (request.typeId() != null) {
            contract.setTypeId(request.typeId());
        }
        if (request.amount() != null) {
            contract.setAmount(request.amount());
        }
        if (request.vatRate() != null) {
            contract.setVatRate(request.vatRate());
        }
        if (request.paymentTerms() != null) {
            contract.setPaymentTerms(request.paymentTerms());
        }
        if (request.plannedStartDate() != null) {
            contract.setPlannedStartDate(request.plannedStartDate());
        }
        if (request.plannedEndDate() != null) {
            contract.setPlannedEndDate(request.plannedEndDate());
        }
        if (request.actualStartDate() != null) {
            contract.setActualStartDate(request.actualStartDate());
        }
        if (request.actualEndDate() != null) {
            contract.setActualEndDate(request.actualEndDate());
        }
        if (request.responsibleId() != null) {
            contract.setResponsibleId(request.responsibleId());
        }
        if (request.retentionPercent() != null) {
            contract.setRetentionPercent(request.retentionPercent());
        }
        if (request.notes() != null) {
            contract.setNotes(request.notes());
        }

        // Recalculate VAT amounts
        BigDecimal amount = contract.getAmount() != null ? contract.getAmount() : BigDecimal.ZERO;
        BigDecimal vatRate = contract.getVatRate() != null ? contract.getVatRate() : new BigDecimal("20.00");
        contract.setVatAmount(calculateVatAmount(amount, vatRate));
        contract.setTotalWithVat(amount.add(contract.getVatAmount()));

        validateDates(contract.getPlannedStartDate(), contract.getPlannedEndDate());

        contract = contractRepository.save(contract);
        auditService.logUpdate("Contract", contract.getId(), "multiple", null, null);

        log.info("Contract updated: {} ({})", contract.getNumber(), contract.getId());
        return ContractResponse.fromEntity(contract);
    }

    @Transactional
    public ContractResponse changeStatus(UUID id, ChangeContractStatusRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        Contract contract = getContractOrThrow(id, organizationId);
        ContractStatus oldStatus = contract.getStatus();
        ContractStatus newStatus = request.status();

        if (!contract.canTransitionTo(newStatus)) {
            throw new IllegalStateException(
                    String.format("Невозможно перевести договор из статуса %s в %s",
                            oldStatus.getDisplayName(), newStatus.getDisplayName()));
        }

        contract.setStatus(newStatus);

        if (newStatus == ContractStatus.CANCELLED || newStatus == ContractStatus.REJECTED) {
            contract.setRejectionReason(request.reason());
        }

        contract = contractRepository.save(contract);
        auditService.logStatusChange("Contract", contract.getId(), oldStatus.name(), newStatus.name());

        log.info("Contract status changed: {} from {} to {} ({})",
                contract.getNumber(), oldStatus, newStatus, contract.getId());
        return ContractResponse.fromEntity(contract);
    }

    @Transactional
    public ContractResponse submitForApproval(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        Contract contract = getContractOrThrow(id, organizationId);

        if (contract.getStatus() != ContractStatus.DRAFT && contract.getStatus() != ContractStatus.REJECTED) {
            throw new IllegalStateException(
                    "Отправить на согласование можно только договор в статусе Черновик или Отклонён");
        }

        // Create approval records based on contract type
        List<String> requiredStages = getRequiredApprovalStages(contract.getTypeId());

        for (String stage : requiredStages) {
            ContractApproval approval = ContractApproval.builder()
                    .contractId(contract.getId())
                    .stage(stage)
                    .status(ApprovalStatus.PENDING)
                    .build();
            contractApprovalRepository.save(approval);
        }

        ContractStatus oldStatus = contract.getStatus();
        contract.setStatus(ContractStatus.ON_APPROVAL);
        contract.setRejectionReason(null);
        contract = contractRepository.save(contract);

        auditService.logStatusChange("Contract", contract.getId(), oldStatus.name(), ContractStatus.ON_APPROVAL.name());

        log.info("Contract submitted for approval: {} ({})", contract.getNumber(), contract.getId());
        return ContractResponse.fromEntity(contract);
    }

    @Transactional
    public ContractResponse approveContract(UUID id, ApproveContractRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        Contract contract = getContractOrThrow(id, organizationId);

        if (contract.getStatus() != ContractStatus.ON_APPROVAL
                && contract.getStatus() != ContractStatus.LAWYER_APPROVED
                && contract.getStatus() != ContractStatus.MANAGEMENT_APPROVED
                && contract.getStatus() != ContractStatus.FINANCE_APPROVED) {
            throw new IllegalStateException("Договор не находится на этапе согласования");
        }

        ContractApproval approval = contractApprovalRepository
                .findByContractIdAndStage(contract.getId(), request.stage())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Этап согласования не найден: " + request.stage()));

        if (approval.getStatus() != ApprovalStatus.PENDING) {
            throw new IllegalStateException("Этап согласования уже обработан");
        }

        approval.setStatus(ApprovalStatus.APPROVED);
        approval.setApprovedAt(Instant.now());
        approval.setComment(request.comment());
        contractApprovalRepository.save(approval);

        // Determine next status based on stage
        ContractStatus oldStatus = contract.getStatus();
        ContractStatus newStatus = determineStatusAfterApproval(contract, request.stage());
        contract.setStatus(newStatus);
        contract = contractRepository.save(contract);

        auditService.logStatusChange("Contract", contract.getId(), oldStatus.name(), newStatus.name());

        log.info("Contract approved at stage {}: {} ({})", request.stage(), contract.getNumber(), contract.getId());
        return ContractResponse.fromEntity(contract);
    }

    @Transactional
    public ContractResponse rejectContract(UUID id, RejectContractRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        Contract contract = getContractOrThrow(id, organizationId);

        if (contract.getStatus() != ContractStatus.ON_APPROVAL
                && contract.getStatus() != ContractStatus.LAWYER_APPROVED
                && contract.getStatus() != ContractStatus.MANAGEMENT_APPROVED
                && contract.getStatus() != ContractStatus.FINANCE_APPROVED) {
            throw new IllegalStateException("Договор не находится на этапе согласования");
        }

        ContractApproval approval = contractApprovalRepository
                .findByContractIdAndStage(contract.getId(), request.stage())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Этап согласования не найден: " + request.stage()));

        approval.setStatus(ApprovalStatus.REJECTED);
        approval.setRejectedAt(Instant.now());
        approval.setRejectionReason(request.reason());
        contractApprovalRepository.save(approval);

        ContractStatus oldStatus = contract.getStatus();
        contract.setStatus(ContractStatus.REJECTED);
        contract.setRejectionReason(request.reason());
        contract = contractRepository.save(contract);

        auditService.logStatusChange("Contract", contract.getId(), oldStatus.name(), ContractStatus.REJECTED.name());

        log.info("Contract rejected at stage {}: {} ({})", request.stage(), contract.getNumber(), contract.getId());
        return ContractResponse.fromEntity(contract);
    }

    @Transactional
    public ContractResponse signContract(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        Contract contract = getContractOrThrow(id, organizationId);

        if (contract.getStatus() != ContractStatus.APPROVED) {
            throw new IllegalStateException("Подписать можно только согласованный договор");
        }

        ContractStatus oldStatus = contract.getStatus();
        contract.setStatus(ContractStatus.SIGNED);
        contract = contractRepository.save(contract);

        auditService.logStatusChange("Contract", contract.getId(), oldStatus.name(), ContractStatus.SIGNED.name());

        log.info("Contract signed: {} ({})", contract.getNumber(), contract.getId());
        return ContractResponse.fromEntity(contract);
    }

    @Transactional
    public ContractResponse activateContract(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        Contract contract = getContractOrThrow(id, organizationId);

        if (contract.getStatus() != ContractStatus.SIGNED) {
            throw new IllegalStateException("Активировать можно только подписанный договор");
        }

        ContractStatus oldStatus = contract.getStatus();
        contract.setStatus(ContractStatus.ACTIVE);
        contract.setActualStartDate(LocalDate.now());
        contract = contractRepository.save(contract);

        auditService.logStatusChange("Contract", contract.getId(), oldStatus.name(), ContractStatus.ACTIVE.name());

        log.info("Contract activated: {} ({})", contract.getNumber(), contract.getId());
        return ContractResponse.fromEntity(contract);
    }

    @Transactional
    public ContractResponse closeContract(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        Contract contract = getContractOrThrow(id, organizationId);

        if (contract.getStatus() != ContractStatus.ACTIVE) {
            throw new IllegalStateException("Закрыть можно только действующий договор");
        }

        ContractStatus oldStatus = contract.getStatus();
        contract.setStatus(ContractStatus.CLOSED);
        contract.setActualEndDate(LocalDate.now());
        contract = contractRepository.save(contract);

        auditService.logStatusChange("Contract", contract.getId(), oldStatus.name(), ContractStatus.CLOSED.name());

        log.info("Contract closed: {} ({})", contract.getNumber(), contract.getId());
        return ContractResponse.fromEntity(contract);
    }

    @Transactional
    public ContractResponse createVersion(UUID id, String comment) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        Contract original = getContractOrThrow(id, organizationId);

        Contract newVersion = Contract.builder()
                .organizationId(organizationId)
                .name(original.getName())
                .number(original.getNumber() + "-v" + (original.getDocVersion() + 1))
                .contractDate(original.getContractDate())
                .partnerId(original.getPartnerId())
                .partnerName(original.getPartnerName())
                .projectId(original.getProjectId())
                .typeId(original.getTypeId())
                .status(ContractStatus.DRAFT)
                .amount(original.getAmount())
                .vatRate(original.getVatRate())
                .vatAmount(original.getVatAmount())
                .totalWithVat(original.getTotalWithVat())
                .paymentTerms(original.getPaymentTerms())
                .plannedStartDate(original.getPlannedStartDate())
                .plannedEndDate(original.getPlannedEndDate())
                .responsibleId(original.getResponsibleId())
                .retentionPercent(original.getRetentionPercent())
                .docVersion(original.getDocVersion() + 1)
                .versionComment(comment)
                .parentVersionId(original.getId())
                .notes(original.getNotes())
                .build();

        newVersion = contractRepository.save(newVersion);
        auditService.logCreate("Contract", newVersion.getId());

        log.info("New version created for contract {}: version {} ({})",
                original.getNumber(), newVersion.getDocVersion(), newVersion.getId());
        return ContractResponse.fromEntity(newVersion);
    }

    @Transactional(readOnly = true)
    public ContractDashboardResponse getDashboardSummary(UUID projectId) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        validateProjectTenant(projectId, organizationId);

        long totalContracts = contractRepository.countActiveContractsByOrganizationId(projectId, organizationId);

        Map<String, Long> statusCounts = new HashMap<>();
        List<Object[]> statusData = contractRepository.countByStatusAndProjectIdAndOrganizationId(projectId, organizationId);
        for (Object[] row : statusData) {
            ContractStatus status = (ContractStatus) row[0];
            Long count = (Long) row[1];
            statusCounts.put(status.name(), count);
        }

        BigDecimal totalAmount = contractRepository.sumTotalAmountByOrganizationId(projectId, organizationId);

        return new ContractDashboardResponse(
                totalContracts,
                statusCounts,
                totalAmount != null ? totalAmount : BigDecimal.ZERO
        );
    }

    @Transactional(readOnly = true)
    public List<com.privod.platform.modules.contract.web.dto.ContractApprovalResponse> getApprovals(UUID contractId) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        getContractOrThrow(contractId, organizationId);
        return contractApprovalRepository.findByContractIdOrderByCreatedAtAsc(contractId)
                .stream()
                .map(com.privod.platform.modules.contract.web.dto.ContractApprovalResponse::fromEntity)
                .toList();
    }

    private Contract getContractOrThrow(UUID id, UUID organizationId) {
        return contractRepository.findByIdAndOrganizationIdAndDeletedFalse(id, organizationId)
                .orElseThrow(() -> new EntityNotFoundException("Договор не найден: " + id));
    }

    private String generateContractNumber() {
        long seq = contractRepository.getNextNumberSequence();
        return String.format("CTR-%05d", seq);
    }

    private void validateDates(LocalDate start, LocalDate end) {
        if (start != null && end != null && end.isBefore(start)) {
            throw new IllegalArgumentException("Дата окончания должна быть позже даты начала");
        }
    }

    private BigDecimal calculateVatAmount(BigDecimal amount, BigDecimal vatRate) {
        if (amount == null || vatRate == null) {
            return BigDecimal.ZERO;
        }
        return amount.multiply(vatRate).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
    }

    private List<String> getRequiredApprovalStages(UUID typeId) {
        List<String> stages = new ArrayList<>();

        if (typeId != null) {
            ContractType type = contractTypeRepository.findById(typeId).orElse(null);
            if (type != null) {
                if (type.isRequiresLawyerApproval()) {
                    stages.add("lawyer");
                }
                if (type.isRequiresManagementApproval()) {
                    stages.add("management");
                }
                if (type.isRequiresFinanceApproval()) {
                    stages.add("finance");
                }
                return stages;
            }
        }

        // Default: all stages required
        stages.add("lawyer");
        stages.add("management");
        stages.add("finance");
        return stages;
    }

    private ContractStatus determineStatusAfterApproval(Contract contract, String stage) {
        return switch (stage) {
            case "lawyer" -> {
                boolean mgmtRequired = !contractApprovalRepository
                        .existsByContractIdAndStageAndStatus(contract.getId(), "management", ApprovalStatus.PENDING)
                        || contractApprovalRepository
                        .existsByContractIdAndStageAndStatus(contract.getId(), "management", ApprovalStatus.APPROVED);
                if (mgmtRequired && contractApprovalRepository
                        .findByContractIdAndStage(contract.getId(), "management").isPresent()) {
                    yield ContractStatus.LAWYER_APPROVED;
                }
                yield allStagesApproved(contract.getId()) ? ContractStatus.APPROVED : ContractStatus.LAWYER_APPROVED;
            }
            case "management" -> {
                if (allStagesApproved(contract.getId())) {
                    yield ContractStatus.APPROVED;
                }
                yield ContractStatus.MANAGEMENT_APPROVED;
            }
            case "finance" -> {
                if (allStagesApproved(contract.getId())) {
                    yield ContractStatus.APPROVED;
                }
                yield ContractStatus.FINANCE_APPROVED;
            }
            default -> throw new IllegalArgumentException("Неизвестный этап согласования: " + stage);
        };
    }

    private boolean allStagesApproved(UUID contractId) {
        List<ContractApproval> approvals = contractApprovalRepository
                .findByContractIdOrderByCreatedAtAsc(contractId);
        return approvals.stream().allMatch(a -> a.getStatus() == ApprovalStatus.APPROVED);
    }

    private void validateProjectTenant(UUID projectId, UUID organizationId) {
        if (projectId == null) {
            return;
        }

        Project project = projectRepository.findById(projectId)
                .filter(p -> !p.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Проект не найден: " + projectId));
        if (project.getOrganizationId() == null || !project.getOrganizationId().equals(organizationId)) {
            throw new EntityNotFoundException("Проект не найден: " + projectId);
        }
    }
}
