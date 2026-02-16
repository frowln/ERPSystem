package com.privod.platform.modules.accounting.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.accounting.domain.EnsAccount;
import com.privod.platform.modules.accounting.domain.EnsOperation;
import com.privod.platform.modules.accounting.domain.EnsOperationStatus;
import com.privod.platform.modules.accounting.domain.EnsPayment;
import com.privod.platform.modules.accounting.domain.EnsPaymentStatus;
import com.privod.platform.modules.accounting.domain.EnsReconciliation;
import com.privod.platform.modules.accounting.domain.EnsReconciliationStatus;
import com.privod.platform.modules.accounting.repository.EnsAccountRepository;
import com.privod.platform.modules.accounting.repository.EnsOperationRepository;
import com.privod.platform.modules.accounting.repository.EnsPaymentRepository;
import com.privod.platform.modules.accounting.repository.EnsReconciliationRepository;
import com.privod.platform.modules.accounting.web.dto.CreateEnsOperationRequest;
import com.privod.platform.modules.accounting.web.dto.CreateEnsPaymentRequest;
import com.privod.platform.modules.accounting.web.dto.CreateEnsReconciliationRequest;
import com.privod.platform.modules.accounting.web.dto.EnsAccountResponse;
import com.privod.platform.modules.accounting.web.dto.EnsOperationResponse;
import com.privod.platform.modules.accounting.web.dto.EnsPaymentResponse;
import com.privod.platform.modules.accounting.web.dto.EnsReconciliationResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class EnsService {

    private final EnsAccountRepository ensAccountRepository;
    private final EnsPaymentRepository ensPaymentRepository;
    private final EnsReconciliationRepository ensReconciliationRepository;
    private final EnsOperationRepository ensOperationRepository;
    private final AuditService auditService;

    // === ENS Accounts ===

    @Transactional(readOnly = true)
    public Page<EnsAccountResponse> listAccounts(Pageable pageable) {
        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();
        return ensAccountRepository.findByOrganizationIdAndDeletedFalse(currentOrgId, pageable)
                .map(EnsAccountResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public EnsAccountResponse getAccount(UUID id) {
        EnsAccount account = getAccountOrThrow(id);
        return EnsAccountResponse.fromEntity(account);
    }

    @Transactional
    public EnsAccountResponse createAccount(String inn) {
        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();
        return createAccount(currentOrgId, inn, null);
    }

    @Transactional
    public EnsAccountResponse createAccount(UUID organizationId, String inn, String accountNumber) {
        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();
        UUID effectiveOrgId = organizationId != null ? organizationId : currentOrgId;
        if (!effectiveOrgId.equals(currentOrgId)) {
            throw new AccessDeniedException("Cannot create ENS account for another organization");
        }

        ensAccountRepository.findByInnAndDeletedFalse(inn)
                .ifPresent(a -> {
                    throw new IllegalStateException("ЕНС с ИНН " + inn + " уже существует");
                });

        EnsAccount account = EnsAccount.builder()
                .organizationId(effectiveOrgId)
                .inn(inn)
                .accountNumber(accountNumber)
                .balance(BigDecimal.ZERO)
                .isActive(true)
                .build();

        account = ensAccountRepository.save(account);
        auditService.logCreate("EnsAccount", account.getId());

        log.info("ЕНС создан: ИНН {}", inn);
        return EnsAccountResponse.fromEntity(account);
    }

    @Transactional
    public EnsAccountResponse updateAccount(UUID id, String inn) {
        EnsAccount account = getAccountOrThrow(id);
        if (inn != null && !inn.isBlank()) {
            account.setInn(inn);
        }
        account = ensAccountRepository.save(account);
        auditService.logUpdate("EnsAccount", account.getId(), "inn", null, inn);
        log.info("ЕНС обновлён: ИНН {} ({})", account.getInn(), id);
        return EnsAccountResponse.fromEntity(account);
    }

    @Transactional
    public EnsAccountResponse toggleActive(UUID id) {
        EnsAccount account = getAccountOrThrow(id);
        boolean oldActive = account.isActive();
        account.setActive(!oldActive);
        account = ensAccountRepository.save(account);
        auditService.logUpdate("EnsAccount", id, "isActive",
                String.valueOf(oldActive), String.valueOf(account.isActive()));

        log.info("ЕНС {}: ИНН {} ({})",
                account.isActive() ? "активирован" : "деактивирован", account.getInn(), id);
        return EnsAccountResponse.fromEntity(account);
    }

    @Transactional
    public EnsAccountResponse syncBalance(UUID accountId) {
        EnsAccount account = getAccountOrThrow(accountId);

        BigDecimal totalPaid = ensPaymentRepository.sumConfirmedPaymentsByAccount(accountId);
        account.setBalance(totalPaid);
        account.setLastSyncAt(Instant.now());
        account.setLastUpdated(Instant.now());

        account = ensAccountRepository.save(account);
        log.info("Баланс ЕНС обновлён: ИНН {} = {} руб.", account.getInn(), totalPaid);
        return EnsAccountResponse.fromEntity(account);
    }

    @Transactional
    public void deleteAccount(UUID id) {
        EnsAccount account = getAccountOrThrow(id);
        account.softDelete();
        ensAccountRepository.save(account);
        auditService.logDelete("EnsAccount", id);
        log.info("ЕНС удалён: ИНН {} ({})", account.getInn(), id);
    }

    // === ENS Payments ===

    @Transactional(readOnly = true)
    public Page<EnsPaymentResponse> listPayments(UUID accountId, Pageable pageable) {
        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();
        if (accountId != null) {
            getAccountOrThrow(accountId);
            return ensPaymentRepository.findByEnsAccountIdAndDeletedFalse(accountId, pageable)
                    .map(EnsPaymentResponse::fromEntity);
        }
        return ensPaymentRepository.findTenantPayments(currentOrgId, pageable)
                .map(EnsPaymentResponse::fromEntity);
    }

    @Transactional
    public EnsPaymentResponse createPayment(CreateEnsPaymentRequest request) {
        getAccountOrThrow(request.ensAccountId());

        EnsPayment payment = EnsPayment.builder()
                .ensAccountId(request.ensAccountId())
                .amount(request.amount())
                .paymentDate(request.paymentDate())
                .taxType(request.taxType())
                .status(EnsPaymentStatus.DRAFT)
                .receiptUrl(request.receiptUrl())
                .build();

        payment = ensPaymentRepository.save(payment);
        auditService.logCreate("EnsPayment", payment.getId());

        log.info("Платёж ЕНС создан: {} руб. по {} ({})",
                request.amount(), request.taxType().getDisplayName(), payment.getId());
        return EnsPaymentResponse.fromEntity(payment);
    }

    @Transactional
    public EnsPaymentResponse updatePayment(UUID id, CreateEnsPaymentRequest request) {
        EnsPayment payment = getPaymentOrThrow(id);

        if (request.amount() != null) payment.setAmount(request.amount());
        if (request.paymentDate() != null) payment.setPaymentDate(request.paymentDate());
        if (request.taxType() != null) payment.setTaxType(request.taxType());
        if (request.receiptUrl() != null) payment.setReceiptUrl(request.receiptUrl());

        payment = ensPaymentRepository.save(payment);
        auditService.logUpdate("EnsPayment", payment.getId(), "multiple", null, null);

        log.info("Платёж ЕНС обновлён: {}", payment.getId());
        return EnsPaymentResponse.fromEntity(payment);
    }

    @Transactional
    public void deletePayment(UUID id) {
        EnsPayment payment = getPaymentOrThrow(id);
        payment.softDelete();
        ensPaymentRepository.save(payment);
        auditService.logDelete("EnsPayment", id);
        log.info("Платёж ЕНС удалён: {}", id);
    }

    @Transactional
    public EnsPaymentResponse confirmPayment(UUID paymentId) {
        EnsPayment payment = getPaymentOrThrow(paymentId);
        EnsPaymentStatus oldStatus = payment.getStatus();

        if (!payment.canTransitionTo(EnsPaymentStatus.CONFIRMED)) {
            throw new IllegalStateException(
                    String.format("Невозможно подтвердить платёж из статуса %s", oldStatus.getDisplayName()));
        }

        payment.setStatus(EnsPaymentStatus.CONFIRMED);
        payment = ensPaymentRepository.save(payment);
        auditService.logStatusChange("EnsPayment", payment.getId(),
                oldStatus.name(), EnsPaymentStatus.CONFIRMED.name());

        log.info("Платёж ЕНС подтверждён: {}", payment.getId());
        return EnsPaymentResponse.fromEntity(payment);
    }

    // === ENS Operations ===

    @Transactional(readOnly = true)
    public Page<EnsOperationResponse> listOperations(UUID accountId, Pageable pageable) {
        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();
        if (accountId != null) {
            getAccountOrThrow(accountId);
            return ensOperationRepository.findByEnsAccountIdAndDeletedFalse(accountId, pageable)
                    .map(EnsOperationResponse::fromEntity);
        }
        return ensOperationRepository.findTenantOperations(currentOrgId, pageable)
                .map(EnsOperationResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public EnsOperationResponse getOperation(UUID id) {
        EnsOperation operation = getOperationOrThrow(id);
        return EnsOperationResponse.fromEntity(operation);
    }

    @Transactional
    public EnsOperationResponse createOperation(CreateEnsOperationRequest request) {
        getAccountOrThrow(request.ensAccountId());

        EnsOperation operation = EnsOperation.builder()
                .ensAccountId(request.ensAccountId())
                .operationDate(request.operationDate())
                .operationType(request.operationType())
                .taxType(request.taxType())
                .amount(request.amount())
                .description(request.description())
                .documentNumber(request.documentNumber())
                .documentDate(request.documentDate())
                .status(EnsOperationStatus.PENDING)
                .build();

        operation = ensOperationRepository.save(operation);
        auditService.logCreate("EnsOperation", operation.getId());

        log.info("Операция ЕНС создана: {} {} руб. ({})",
                operation.getOperationType().getDisplayName(), operation.getAmount(), operation.getId());
        return EnsOperationResponse.fromEntity(operation);
    }

    @Transactional
    public EnsOperationResponse processOperation(UUID id) {
        EnsOperation operation = getOperationOrThrow(id);
        EnsOperationStatus oldStatus = operation.getStatus();

        if (!operation.canTransitionTo(EnsOperationStatus.PROCESSED)) {
            throw new IllegalStateException(
                    String.format("Невозможно обработать операцию из статуса '%s'", oldStatus.getDisplayName()));
        }

        operation.setStatus(EnsOperationStatus.PROCESSED);
        operation = ensOperationRepository.save(operation);
        auditService.logStatusChange("EnsOperation", operation.getId(),
                oldStatus.name(), EnsOperationStatus.PROCESSED.name());

        log.info("Операция ЕНС обработана: {}", operation.getId());
        return EnsOperationResponse.fromEntity(operation);
    }

    @Transactional
    public EnsOperationResponse cancelOperation(UUID id) {
        EnsOperation operation = getOperationOrThrow(id);
        EnsOperationStatus oldStatus = operation.getStatus();

        if (!operation.canTransitionTo(EnsOperationStatus.CANCELLED)) {
            throw new IllegalStateException(
                    String.format("Невозможно отменить операцию из статуса '%s'", oldStatus.getDisplayName()));
        }

        operation.setStatus(EnsOperationStatus.CANCELLED);
        operation = ensOperationRepository.save(operation);
        auditService.logStatusChange("EnsOperation", operation.getId(),
                oldStatus.name(), EnsOperationStatus.CANCELLED.name());

        log.info("Операция ЕНС отменена: {}", operation.getId());
        return EnsOperationResponse.fromEntity(operation);
    }

    @Transactional(readOnly = true)
    public List<EnsOperationResponse> getOperationsByPeriod(UUID accountId, LocalDate from, LocalDate to) {
        getAccountOrThrow(accountId);
        return ensOperationRepository.findByEnsAccountIdAndOperationDateBetweenAndDeletedFalse(accountId, from, to)
                .stream()
                .map(EnsOperationResponse::fromEntity)
                .toList();
    }

    // === ENS Reconciliation ===

    @Transactional(readOnly = true)
    public Page<EnsReconciliationResponse> listReconciliations(UUID accountId, Pageable pageable) {
        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();
        if (accountId != null) {
            getAccountOrThrow(accountId);
            return ensReconciliationRepository.findByEnsAccountIdAndDeletedFalse(accountId, pageable)
                    .map(EnsReconciliationResponse::fromEntity);
        }
        return ensReconciliationRepository.findTenantReconciliations(currentOrgId, pageable)
                .map(EnsReconciliationResponse::fromEntity);
    }

    @Transactional
    public EnsReconciliation createReconciliation(UUID accountId, UUID periodId,
                                                   BigDecimal expectedAmount, BigDecimal actualAmount) {
        getAccountOrThrow(accountId);

        EnsReconciliation reconciliation = EnsReconciliation.builder()
                .ensAccountId(accountId)
                .periodId(periodId)
                .expectedAmount(expectedAmount)
                .actualAmount(actualAmount)
                .difference(expectedAmount.subtract(actualAmount))
                .status(EnsReconciliationStatus.DRAFT)
                .build();

        reconciliation = ensReconciliationRepository.save(reconciliation);
        auditService.logCreate("EnsReconciliation", reconciliation.getId());

        log.info("Сверка ЕНС создана: ожидалось {} руб., фактически {} руб., разница {} руб.",
                expectedAmount, actualAmount, reconciliation.getDifference());
        return reconciliation;
    }

    @Transactional
    public EnsReconciliationResponse createReconciliationEnhanced(CreateEnsReconciliationRequest request) {
        getAccountOrThrow(request.ensAccountId());

        BigDecimal openingBalance = request.openingBalance() != null ? request.openingBalance() : BigDecimal.ZERO;
        BigDecimal totalDebits = request.totalDebits() != null ? request.totalDebits() : BigDecimal.ZERO;
        BigDecimal totalCredits = request.totalCredits() != null ? request.totalCredits() : BigDecimal.ZERO;
        BigDecimal closingBalance = request.closingBalance() != null ? request.closingBalance()
                : openingBalance.add(totalCredits).subtract(totalDebits);
        BigDecimal difference = totalDebits.subtract(totalCredits);

        EnsReconciliation reconciliation = EnsReconciliation.builder()
                .ensAccountId(request.ensAccountId())
                .periodId(UUID.randomUUID()) // Will be linked to period entity
                .periodStart(request.periodStart())
                .periodEnd(request.periodEnd())
                .openingBalance(openingBalance)
                .expectedAmount(totalDebits)
                .actualAmount(totalCredits)
                .totalDebits(totalDebits)
                .totalCredits(totalCredits)
                .closingBalance(closingBalance)
                .difference(difference)
                .status(EnsReconciliationStatus.DRAFT)
                .notes(request.notes())
                .build();

        reconciliation = ensReconciliationRepository.save(reconciliation);
        auditService.logCreate("EnsReconciliation", reconciliation.getId());

        log.info("Расширенная сверка ЕНС создана: период {} - {}, дебет {} руб., кредит {} руб.",
                request.periodStart(), request.periodEnd(), totalDebits, totalCredits);
        return EnsReconciliationResponse.fromEntity(reconciliation);
    }

    @Transactional
    public EnsReconciliationResponse completeReconciliation(UUID id, UUID reconciledById) {
        EnsReconciliation reconciliation = getReconciliationOrThrow(id);

        if (!reconciliation.getStatus().canTransitionTo(EnsReconciliationStatus.IN_PROGRESS)) {
            throw new IllegalStateException("Невозможно начать сверку из статуса '"
                    + reconciliation.getStatus().getDisplayName() + "'");
        }

        BigDecimal difference = reconciliation.calculateDifference();
        EnsReconciliationStatus newStatus = difference.compareTo(BigDecimal.ZERO) == 0
                ? EnsReconciliationStatus.MATCHED
                : EnsReconciliationStatus.DISCREPANCY;

        reconciliation.setStatus(newStatus);
        reconciliation.setDifference(difference);
        reconciliation.setDiscrepancyAmount(difference.abs());
        reconciliation.setReconciledById(reconciledById);
        reconciliation.setReconciledAt(Instant.now());

        reconciliation = ensReconciliationRepository.save(reconciliation);
        auditService.logStatusChange("EnsReconciliation", id, "DRAFT", newStatus.name());

        log.info("Сверка ЕНС завершена: {} ({}), разница {} руб.",
                newStatus.getDisplayName(), id, difference);
        return EnsReconciliationResponse.fromEntity(reconciliation);
    }

    // === Private helpers ===

    private EnsAccount getAccountOrThrow(UUID id) {
        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();
        return ensAccountRepository.findByIdAndOrganizationIdAndDeletedFalse(id, currentOrgId)
                .orElseThrow(() -> new EntityNotFoundException("Счёт ЕНС не найден: " + id));
    }

    private EnsPayment getPaymentOrThrow(UUID id) {
        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();
        return ensPaymentRepository.findByIdForTenant(id, currentOrgId)
                .orElseThrow(() -> new EntityNotFoundException("Платёж ЕНС не найден: " + id));
    }

    private EnsOperation getOperationOrThrow(UUID id) {
        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();
        return ensOperationRepository.findByIdForTenant(id, currentOrgId)
                .orElseThrow(() -> new EntityNotFoundException("Операция ЕНС не найдена: " + id));
    }

    private EnsReconciliation getReconciliationOrThrow(UUID id) {
        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();
        return ensReconciliationRepository.findByIdForTenant(id, currentOrgId)
                .orElseThrow(() -> new EntityNotFoundException("Сверка ЕНС не найдена: " + id));
    }
}
