package com.privod.platform.modules.selfEmployed.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.selfEmployed.domain.ContractorStatus;
import com.privod.platform.modules.selfEmployed.domain.RegistryStatus;
import com.privod.platform.modules.selfEmployed.domain.SelfEmployedContractor;
import com.privod.platform.modules.selfEmployed.domain.SelfEmployedPayment;
import com.privod.platform.modules.selfEmployed.domain.SelfEmployedPaymentStatus;
import com.privod.platform.modules.selfEmployed.domain.SelfEmployedRegistry;
import com.privod.platform.modules.selfEmployed.repository.SelfEmployedContractorRepository;
import com.privod.platform.modules.selfEmployed.repository.SelfEmployedPaymentRepository;
import com.privod.platform.modules.selfEmployed.repository.SelfEmployedRegistryRepository;
import com.privod.platform.modules.selfEmployed.web.dto.ContractorResponse;
import com.privod.platform.modules.selfEmployed.web.dto.CreateContractorRequest;
import com.privod.platform.modules.selfEmployed.web.dto.CreateRegistryRequest;
import com.privod.platform.modules.selfEmployed.web.dto.CreateSelfEmployedPaymentRequest;
import com.privod.platform.modules.selfEmployed.web.dto.GenerateRegistryRequest;
import com.privod.platform.modules.selfEmployed.web.dto.RegistryResponse;
import com.privod.platform.modules.selfEmployed.web.dto.SelfEmployedPaymentResponse;
import com.privod.platform.modules.selfEmployed.web.dto.UpdateContractorRequest;
import com.privod.platform.modules.selfEmployed.web.dto.UpdateSelfEmployedPaymentRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SelfEmployedService {

    private final SelfEmployedContractorRepository contractorRepository;
    private final SelfEmployedPaymentRepository paymentRepository;
    private final SelfEmployedRegistryRepository registryRepository;
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

    // ---- Private helpers ----

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
