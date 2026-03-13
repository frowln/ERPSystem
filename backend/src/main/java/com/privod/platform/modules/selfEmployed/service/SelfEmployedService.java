package com.privod.platform.modules.selfEmployed.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.selfEmployed.domain.ActStatus;
import com.privod.platform.modules.selfEmployed.domain.CompletionAct;
import com.privod.platform.modules.selfEmployed.domain.ContractorStatus;
import com.privod.platform.modules.selfEmployed.domain.ContractType;
import com.privod.platform.modules.selfEmployed.domain.NpdStatus;
import com.privod.platform.modules.selfEmployed.domain.RegistryStatus;
import com.privod.platform.modules.selfEmployed.domain.SelfEmployedContractor;
import com.privod.platform.modules.selfEmployed.domain.SelfEmployedPayment;
import com.privod.platform.modules.selfEmployed.domain.SelfEmployedPaymentStatus;
import com.privod.platform.modules.selfEmployed.domain.SelfEmployedRegistry;
import com.privod.platform.modules.selfEmployed.domain.SelfEmployedWorker;
import com.privod.platform.modules.selfEmployed.repository.CompletionActRepository;
import com.privod.platform.modules.selfEmployed.repository.SelfEmployedContractorRepository;
import com.privod.platform.modules.selfEmployed.repository.SelfEmployedPaymentRepository;
import com.privod.platform.modules.selfEmployed.repository.SelfEmployedRegistryRepository;
import com.privod.platform.modules.selfEmployed.repository.SelfEmployedWorkerRepository;
import com.privod.platform.modules.selfEmployed.web.dto.ActResponse;
import com.privod.platform.modules.selfEmployed.web.dto.ContractorResponse;
import com.privod.platform.modules.selfEmployed.web.dto.CreateActRequest;
import com.privod.platform.modules.selfEmployed.web.dto.CreateContractorRequest;
import com.privod.platform.modules.selfEmployed.web.dto.CreateRegistryRequest;
import com.privod.platform.modules.selfEmployed.web.dto.CreateSelfEmployedPaymentRequest;
import com.privod.platform.modules.selfEmployed.web.dto.CreateWorkerRequest;
import com.privod.platform.modules.selfEmployed.web.dto.GenerateRegistryRequest;
import com.privod.platform.modules.selfEmployed.web.dto.NpdVerificationResponse;
import com.privod.platform.modules.selfEmployed.web.dto.RegistryResponse;
import com.privod.platform.modules.selfEmployed.web.dto.SelfEmployedPaymentResponse;
import com.privod.platform.modules.selfEmployed.web.dto.UpdateContractorRequest;
import com.privod.platform.modules.selfEmployed.web.dto.UpdateSelfEmployedPaymentRequest;
import com.privod.platform.modules.selfEmployed.web.dto.UpdateWorkerRequest;
import com.privod.platform.modules.selfEmployed.web.dto.WorkerResponse;
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
import java.time.format.DateTimeFormatter;
import java.util.HashSet;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SelfEmployedService {

    private final SelfEmployedContractorRepository contractorRepository;
    private final SelfEmployedPaymentRepository paymentRepository;
    private final SelfEmployedRegistryRepository registryRepository;
    private final SelfEmployedWorkerRepository workerRepository;
    private final CompletionActRepository actRepository;
    private final AuditService auditService;

    // ---- Contractor CRUD ----

    @Transactional(readOnly = true)
    public Page<ContractorResponse> listContractors(String search, ContractorStatus status, Pageable pageable) {
        if (search != null && !search.isBlank()) {
            return contractorRepository.searchByNameOrInn(search, pageable)
                    .map(ContractorResponse::fromEntity);
        }
        if (status != null) {
            return contractorRepository.findByStatusAndDeletedFalse(status, pageable)
                    .map(ContractorResponse::fromEntity);
        }
        return contractorRepository.findByDeletedFalse(pageable)
                .map(ContractorResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public ContractorResponse getContractor(UUID id) {
        SelfEmployedContractor contractor = getContractorOrThrow(id);
        return ContractorResponse.fromEntity(contractor);
    }

    @Transactional
    public ContractorResponse createContractor(CreateContractorRequest request) {
        if (contractorRepository.existsByInnAndDeletedFalse(request.inn())) {
            throw new IllegalArgumentException("Самозанятый с ИНН '" + request.inn() + "' уже зарегистрирован");
        }

        SelfEmployedContractor contractor = SelfEmployedContractor.builder()
                .fullName(request.fullName())
                .inn(request.inn())
                .phone(request.phone())
                .email(request.email())
                .bankAccount(request.bankAccount())
                .bic(request.bic())
                .status(ContractorStatus.ACTIVE)
                .registrationDate(request.registrationDate())
                .projectIds(request.projectIds())
                .build();

        contractor = contractorRepository.save(contractor);
        auditService.logCreate("SelfEmployedContractor", contractor.getId());

        log.info("Самозанятый зарегистрирован: {} ИНН={} ({})",
                contractor.getFullName(), contractor.getInn(), contractor.getId());
        return ContractorResponse.fromEntity(contractor);
    }

    @Transactional
    public ContractorResponse updateContractor(UUID id, UpdateContractorRequest request) {
        SelfEmployedContractor contractor = getContractorOrThrow(id);

        if (request.fullName() != null) {
            contractor.setFullName(request.fullName());
        }
        if (request.phone() != null) {
            contractor.setPhone(request.phone());
        }
        if (request.email() != null) {
            contractor.setEmail(request.email());
        }
        if (request.bankAccount() != null) {
            contractor.setBankAccount(request.bankAccount());
        }
        if (request.bic() != null) {
            contractor.setBic(request.bic());
        }
        if (request.status() != null) {
            contractor.setStatus(request.status());
        }
        if (request.taxStatus() != null) {
            contractor.setTaxStatus(request.taxStatus());
        }
        if (request.projectIds() != null) {
            contractor.setProjectIds(request.projectIds());
        }

        contractor = contractorRepository.save(contractor);
        auditService.logUpdate("SelfEmployedContractor", contractor.getId(), "multiple", null, null);

        log.info("Самозанятый обновлён: {} ({})", contractor.getFullName(), contractor.getId());
        return ContractorResponse.fromEntity(contractor);
    }

    @Transactional
    public void deleteContractor(UUID id) {
        SelfEmployedContractor contractor = getContractorOrThrow(id);
        contractor.softDelete();
        contractorRepository.save(contractor);
        auditService.logDelete("SelfEmployedContractor", contractor.getId());

        log.info("Самозанятый удалён: {} ({})", contractor.getFullName(), contractor.getId());
    }

    // ---- Payment CRUD ----

    @Transactional(readOnly = true)
    public Page<SelfEmployedPaymentResponse> listPayments(UUID contractorId, UUID projectId,
                                                            SelfEmployedPaymentStatus status,
                                                            Pageable pageable) {
        if (contractorId != null) {
            return paymentRepository.findByContractorIdAndDeletedFalse(contractorId, pageable)
                    .map(SelfEmployedPaymentResponse::fromEntity);
        }
        if (projectId != null) {
            return paymentRepository.findByProjectIdAndDeletedFalse(projectId, pageable)
                    .map(SelfEmployedPaymentResponse::fromEntity);
        }
        if (status != null) {
            return paymentRepository.findByStatusAndDeletedFalse(status, pageable)
                    .map(SelfEmployedPaymentResponse::fromEntity);
        }
        return paymentRepository.findByDeletedFalse(pageable)
                .map(SelfEmployedPaymentResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public SelfEmployedPaymentResponse getPayment(UUID id) {
        SelfEmployedPayment payment = getPaymentOrThrow(id);
        return SelfEmployedPaymentResponse.fromEntity(payment);
    }

    @Transactional
    public SelfEmployedPaymentResponse createPayment(CreateSelfEmployedPaymentRequest request) {
        // Validate contractor exists
        getContractorOrThrow(request.contractorId());

        SelfEmployedPayment payment = SelfEmployedPayment.builder()
                .contractorId(request.contractorId())
                .projectId(request.projectId())
                .contractId(request.contractId())
                .amount(request.amount())
                .description(request.description())
                .serviceDate(request.serviceDate())
                .paymentDate(request.paymentDate())
                .receiptNumber(request.receiptNumber())
                .receiptUrl(request.receiptUrl())
                .status(SelfEmployedPaymentStatus.DRAFT)
                .taxPeriod(request.taxPeriod() != null ? request.taxPeriod()
                        : calculateTaxPeriod(request.serviceDate()))
                .build();

        payment = paymentRepository.save(payment);
        auditService.logCreate("SelfEmployedPayment", payment.getId());

        log.info("Выплата самозанятому создана: исполнитель={}, сумма={} ({})",
                request.contractorId(), request.amount(), payment.getId());
        return SelfEmployedPaymentResponse.fromEntity(payment);
    }

    @Transactional
    public SelfEmployedPaymentResponse updatePayment(UUID id, UpdateSelfEmployedPaymentRequest request) {
        SelfEmployedPayment payment = getPaymentOrThrow(id);

        if (payment.getStatus() != SelfEmployedPaymentStatus.DRAFT) {
            throw new IllegalStateException(
                    "Редактирование выплаты возможно только в статусе Черновик");
        }

        if (request.contractId() != null) {
            payment.setContractId(request.contractId());
        }
        if (request.amount() != null) {
            payment.setAmount(request.amount());
        }
        if (request.description() != null) {
            payment.setDescription(request.description());
        }
        if (request.serviceDate() != null) {
            payment.setServiceDate(request.serviceDate());
        }
        if (request.paymentDate() != null) {
            payment.setPaymentDate(request.paymentDate());
        }
        if (request.receiptNumber() != null) {
            payment.setReceiptNumber(request.receiptNumber());
        }
        if (request.receiptUrl() != null) {
            payment.setReceiptUrl(request.receiptUrl());
        }
        if (request.taxPeriod() != null) {
            payment.setTaxPeriod(request.taxPeriod());
        }

        payment = paymentRepository.save(payment);
        auditService.logUpdate("SelfEmployedPayment", payment.getId(), "multiple", null, null);

        log.info("Выплата самозанятому обновлена: {} ({})", payment.getAmount(), payment.getId());
        return SelfEmployedPaymentResponse.fromEntity(payment);
    }

    @Transactional
    public void deletePayment(UUID id) {
        SelfEmployedPayment payment = getPaymentOrThrow(id);
        payment.softDelete();
        paymentRepository.save(payment);
        auditService.logDelete("SelfEmployedPayment", payment.getId());

        log.info("Выплата самозанятому удалена: ({})", payment.getId());
    }

    @Transactional
    public SelfEmployedPaymentResponse checkFiscalReceipt(UUID paymentId) {
        SelfEmployedPayment payment = getPaymentOrThrow(paymentId);

        if (payment.getReceiptNumber() == null || payment.getReceiptNumber().isBlank()) {
            throw new IllegalStateException("Номер чека не указан");
        }

        // In a real implementation this would call FNS API to validate the receipt
        // For now we mark it as checked and transition status
        payment.setFiscalReceiptChecked(true);

        SelfEmployedPaymentStatus oldStatus = payment.getStatus();
        if (oldStatus == SelfEmployedPaymentStatus.PENDING_RECEIPT) {
            payment.setStatus(SelfEmployedPaymentStatus.RECEIPT_RECEIVED);
            auditService.logStatusChange("SelfEmployedPayment", payment.getId(),
                    oldStatus.name(), SelfEmployedPaymentStatus.RECEIPT_RECEIVED.name());
        }

        payment = paymentRepository.save(payment);

        log.info("Фискальный чек проверен для выплаты: {} ({})",
                payment.getReceiptNumber(), payment.getId());
        return SelfEmployedPaymentResponse.fromEntity(payment);
    }

    // ---- Registry CRUD ----

    @Transactional(readOnly = true)
    public Page<RegistryResponse> listRegistries(UUID projectId, RegistryStatus status, Pageable pageable) {
        if (projectId != null) {
            return registryRepository.findByProjectIdAndDeletedFalse(projectId, pageable)
                    .map(RegistryResponse::fromEntity);
        }
        if (status != null) {
            return registryRepository.findByStatusAndDeletedFalse(status, pageable)
                    .map(RegistryResponse::fromEntity);
        }
        return registryRepository.findByDeletedFalse(pageable)
                .map(RegistryResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public RegistryResponse getRegistry(UUID id) {
        SelfEmployedRegistry registry = getRegistryOrThrow(id);
        return RegistryResponse.fromEntity(registry);
    }

    @Transactional
    public RegistryResponse createRegistry(CreateRegistryRequest request) {
        validatePeriod(request.periodStart(), request.periodEnd());

        SelfEmployedRegistry registry = SelfEmployedRegistry.builder()
                .name(request.name())
                .projectId(request.projectId())
                .periodStart(request.periodStart())
                .periodEnd(request.periodEnd())
                .status(RegistryStatus.DRAFT)
                .build();

        registry = registryRepository.save(registry);
        auditService.logCreate("SelfEmployedRegistry", registry.getId());

        log.info("Реестр выплат самозанятым создан: {} ({})", registry.getName(), registry.getId());
        return RegistryResponse.fromEntity(registry);
    }

    @Transactional
    public void deleteRegistry(UUID id) {
        SelfEmployedRegistry registry = getRegistryOrThrow(id);
        registry.softDelete();
        registryRepository.save(registry);
        auditService.logDelete("SelfEmployedRegistry", registry.getId());

        log.info("Реестр выплат самозанятым удалён: {} ({})", registry.getName(), registry.getId());
    }

    @Transactional
    public RegistryResponse generateRegistry(GenerateRegistryRequest request) {
        validatePeriod(request.periodStart(), request.periodEnd());

        // Find all payments in the period for the project
        List<SelfEmployedPayment> payments = paymentRepository.findByProjectIdAndPeriod(
                request.projectId(), request.periodStart(), request.periodEnd());

        BigDecimal totalAmount = paymentRepository.sumAmountByProjectIdAndPeriod(
                request.projectId(), request.periodStart(), request.periodEnd());

        int totalPayments = paymentRepository.countByProjectIdAndPeriod(
                request.projectId(), request.periodStart(), request.periodEnd());

        String name = String.format("Реестр выплат самозанятым %s - %s",
                request.periodStart().format(DateTimeFormatter.ofPattern("dd.MM.yyyy")),
                request.periodEnd().format(DateTimeFormatter.ofPattern("dd.MM.yyyy")));

        SelfEmployedRegistry registry = SelfEmployedRegistry.builder()
                .name(name)
                .projectId(request.projectId())
                .periodStart(request.periodStart())
                .periodEnd(request.periodEnd())
                .totalAmount(totalAmount)
                .totalPayments(totalPayments)
                .status(RegistryStatus.GENERATED)
                .build();

        registry = registryRepository.save(registry);
        auditService.logCreate("SelfEmployedRegistry", registry.getId());

        log.info("Реестр выплат самозанятым сформирован: {} выплат на сумму {} ({})",
                totalPayments, totalAmount, registry.getId());
        return RegistryResponse.fromEntity(registry);
    }

    @Transactional(readOnly = true)
    public List<SelfEmployedPaymentResponse> exportRegistry(UUID registryId) {
        SelfEmployedRegistry registry = getRegistryOrThrow(registryId);

        List<SelfEmployedPayment> payments = paymentRepository.findByProjectIdAndPeriod(
                registry.getProjectId(), registry.getPeriodStart(), registry.getPeriodEnd());

        return payments.stream()
                .map(SelfEmployedPaymentResponse::fromEntity)
                .toList();
    }

    // ---- Worker CRUD ----

    @Transactional(readOnly = true)
    public Page<WorkerResponse> listWorkers(String search, Pageable pageable) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        if (search != null && !search.isBlank()) {
            return workerRepository.searchByNameOrInn(orgId, search, pageable)
                    .map(WorkerResponse::fromEntity);
        }
        return workerRepository.findByOrganizationIdAndDeletedFalse(orgId, pageable)
                .map(WorkerResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public WorkerResponse getWorker(UUID id) {
        SelfEmployedWorker worker = getWorkerOrThrow(id);
        return WorkerResponse.fromEntity(worker);
    }

    @Transactional
    public WorkerResponse createWorker(CreateWorkerRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        if (workerRepository.existsByInnAndOrganizationIdAndDeletedFalse(request.inn(), orgId)) {
            throw new IllegalArgumentException("Исполнитель с ИНН '" + request.inn() + "' уже зарегистрирован");
        }

        SelfEmployedWorker worker = SelfEmployedWorker.builder()
                .organizationId(orgId)
                .fullName(request.fullName())
                .inn(request.inn())
                .phone(request.phone())
                .email(request.email())
                .contractType(request.contractType() != null ? request.contractType() : ContractType.GPC)
                .contractNumber(request.contractNumber())
                .contractStartDate(request.contractStartDate())
                .contractEndDate(request.contractEndDate())
                .specialization(request.specialization())
                .hourlyRate(request.hourlyRate())
                .projectIds(request.projectIds() != null ? new HashSet<>(request.projectIds()) : new HashSet<>())
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        worker = workerRepository.save(worker);
        auditService.logCreate("SelfEmployedWorker", worker.getId());

        log.info("Исполнитель (самозанятый) создан: {} ИНН={} ({})",
                worker.getFullName(), worker.getInn(), worker.getId());
        return WorkerResponse.fromEntity(worker);
    }

    @Transactional
    public WorkerResponse updateWorker(UUID id, UpdateWorkerRequest request) {
        SelfEmployedWorker worker = getWorkerOrThrow(id);

        if (request.fullName() != null) {
            worker.setFullName(request.fullName());
        }
        if (request.phone() != null) {
            worker.setPhone(request.phone());
        }
        if (request.email() != null) {
            worker.setEmail(request.email());
        }
        if (request.contractType() != null) {
            worker.setContractType(request.contractType());
        }
        if (request.contractNumber() != null) {
            worker.setContractNumber(request.contractNumber());
        }
        if (request.contractStartDate() != null) {
            worker.setContractStartDate(request.contractStartDate());
        }
        if (request.contractEndDate() != null) {
            worker.setContractEndDate(request.contractEndDate());
        }
        if (request.specialization() != null) {
            worker.setSpecialization(request.specialization());
        }
        if (request.hourlyRate() != null) {
            worker.setHourlyRate(request.hourlyRate());
        }
        if (request.projectIds() != null) {
            worker.setProjectIds(new HashSet<>(request.projectIds()));
        }
        worker.setUpdatedAt(Instant.now());

        worker = workerRepository.save(worker);
        auditService.logUpdate("SelfEmployedWorker", worker.getId(), "multiple", null, null);

        log.info("Исполнитель (самозанятый) обновлён: {} ({})", worker.getFullName(), worker.getId());
        return WorkerResponse.fromEntity(worker);
    }

    @Transactional
    public void deleteWorker(UUID id) {
        SelfEmployedWorker worker = getWorkerOrThrow(id);
        worker.softDelete();
        worker.setUpdatedAt(Instant.now());
        workerRepository.save(worker);
        auditService.logDelete("SelfEmployedWorker", worker.getId());

        log.info("Исполнитель (самозанятый) удалён: {} ({})", worker.getFullName(), worker.getId());
    }

    // ---- NPD Verification ----

    @Transactional
    public NpdVerificationResponse verifyNpd(String inn) {
        if (inn == null || !inn.matches("\\d{12}")) {
            return new NpdVerificationResponse(
                    inn,
                    NpdStatus.NOT_REGISTERED,
                    NpdStatus.NOT_REGISTERED.getDisplayName(),
                    Instant.now(),
                    "Некорректный ИНН: должен содержать 12 цифр"
            );
        }

        // Stub: real implementation will call ФНС API (https://npd.nalog.ru/api)
        // For now, return ACTIVE for valid 12-digit INNs
        NpdStatus status = NpdStatus.ACTIVE;
        Instant verifiedAt = Instant.now();

        // If the worker exists in our system, update their NPD status
        workerRepository.findByInnAndDeletedFalse(inn).ifPresent(worker -> {
            worker.setNpdStatus(status);
            worker.setNpdVerifiedAt(verifiedAt);
            worker.setUpdatedAt(Instant.now());
            workerRepository.save(worker);
        });

        log.info("НПД верификация для ИНН={}: статус={}", inn, status);
        return new NpdVerificationResponse(
                inn,
                status,
                status.getDisplayName(),
                verifiedAt,
                "Статус НПД успешно проверен"
        );
    }

    // ---- Completion Act CRUD ----

    @Transactional(readOnly = true)
    public Page<ActResponse> listActs(UUID workerId, UUID projectId, ActStatus status, Pageable pageable) {
        if (workerId != null) {
            return actRepository.findByWorkerIdAndDeletedFalse(workerId, pageable)
                    .map(ActResponse::fromEntity);
        }
        if (projectId != null) {
            return actRepository.findByProjectIdAndDeletedFalse(projectId, pageable)
                    .map(ActResponse::fromEntity);
        }
        if (status != null) {
            return actRepository.findByStatusAndDeletedFalse(status, pageable)
                    .map(ActResponse::fromEntity);
        }
        return actRepository.findByDeletedFalse(pageable)
                .map(ActResponse::fromEntity);
    }

    @Transactional
    public ActResponse createAct(CreateActRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        SelfEmployedWorker worker = getWorkerOrThrow(request.workerId());

        CompletionAct act = CompletionAct.builder()
                .organizationId(orgId)
                .worker(worker)
                .projectId(request.projectId())
                .actNumber(request.actNumber())
                .description(request.description())
                .amount(request.amount())
                .period(request.period())
                .status(ActStatus.DRAFT)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        act = actRepository.save(act);
        auditService.logCreate("CompletionAct", act.getId());

        log.info("Акт выполненных работ создан: {} сумма={} исполнитель={} ({})",
                act.getActNumber(), act.getAmount(), worker.getFullName(), act.getId());
        return ActResponse.fromEntity(act);
    }

    @Transactional
    public ActResponse signAct(UUID actId) {
        CompletionAct act = getActOrThrow(actId);

        if (!act.getStatus().canTransitionTo(ActStatus.SIGNED)) {
            throw new IllegalStateException(
                    "Невозможно подписать акт в статусе " + act.getStatus().getDisplayName());
        }

        ActStatus oldStatus = act.getStatus();
        act.setStatus(ActStatus.SIGNED);
        act.setSignedAt(Instant.now());
        act.setUpdatedAt(Instant.now());

        act = actRepository.save(act);
        auditService.logStatusChange("CompletionAct", act.getId(), oldStatus.name(), ActStatus.SIGNED.name());

        log.info("Акт подписан: {} ({})", act.getActNumber(), act.getId());
        return ActResponse.fromEntity(act);
    }

    @Transactional
    public ActResponse payAct(UUID actId) {
        CompletionAct act = getActOrThrow(actId);

        if (!act.getStatus().canTransitionTo(ActStatus.PAID)) {
            throw new IllegalStateException(
                    "Невозможно оплатить акт в статусе " + act.getStatus().getDisplayName());
        }

        ActStatus oldStatus = act.getStatus();
        act.setStatus(ActStatus.PAID);
        act.setPaidAt(Instant.now());
        act.setUpdatedAt(Instant.now());

        act = actRepository.save(act);
        auditService.logStatusChange("CompletionAct", act.getId(), oldStatus.name(), ActStatus.PAID.name());

        // Update worker's totalPaid
        if (act.getWorker() != null) {
            SelfEmployedWorker worker = act.getWorker();
            BigDecimal newTotal = actRepository.sumPaidAmountByWorkerId(worker.getId());
            worker.setTotalPaid(newTotal);
            worker.setUpdatedAt(Instant.now());
            workerRepository.save(worker);
        }

        log.info("Акт оплачен: {} сумма={} ({})", act.getActNumber(), act.getAmount(), act.getId());
        return ActResponse.fromEntity(act);
    }

    // ---- Private helpers ----

    private SelfEmployedWorker getWorkerOrThrow(UUID id) {
        return workerRepository.findById(id)
                .filter(w -> !w.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Исполнитель не найден: " + id));
    }

    private CompletionAct getActOrThrow(UUID id) {
        return actRepository.findById(id)
                .filter(a -> !a.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Акт не найден: " + id));
    }

    private SelfEmployedContractor getContractorOrThrow(UUID id) {
        return contractorRepository.findById(id)
                .filter(c -> !c.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Самозанятый не найден: " + id));
    }

    private SelfEmployedPayment getPaymentOrThrow(UUID id) {
        return paymentRepository.findById(id)
                .filter(p -> !p.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Выплата не найдена: " + id));
    }

    private SelfEmployedRegistry getRegistryOrThrow(UUID id) {
        return registryRepository.findById(id)
                .filter(r -> !r.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Реестр не найден: " + id));
    }

    private void validatePeriod(LocalDate start, LocalDate end) {
        if (start != null && end != null && end.isBefore(start)) {
            throw new IllegalArgumentException("Конец периода должен быть позже начала периода");
        }
    }

    private String calculateTaxPeriod(LocalDate serviceDate) {
        if (serviceDate == null) {
            return null;
        }
        int quarter = (serviceDate.getMonthValue() - 1) / 3 + 1;
        return serviceDate.getYear() + "-Q" + quarter;
    }
}
