package com.privod.platform.modules.accounting.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.accounting.domain.DeclarationStatus;
import com.privod.platform.modules.accounting.domain.DeclarationType;
import com.privod.platform.modules.accounting.domain.AccountPeriod;
import com.privod.platform.modules.accounting.domain.TaxDeclaration;
import com.privod.platform.modules.accounting.repository.AccountPeriodRepository;
import com.privod.platform.modules.accounting.repository.TaxDeclarationRepository;
import com.privod.platform.modules.finance.domain.InvoiceType;
import com.privod.platform.modules.finance.repository.InvoiceRepository;
import com.privod.platform.modules.accounting.web.dto.CreateTaxDeclarationRequest;
import com.privod.platform.modules.accounting.web.dto.TaxDeclarationResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TaxDeclarationService {

    private final TaxDeclarationRepository taxDeclarationRepository;
    private final AccountPeriodRepository accountPeriodRepository;
    private final InvoiceRepository invoiceRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<TaxDeclarationResponse> listDeclarations(DeclarationType type,
                                                          DeclarationStatus status,
                                                          Pageable pageable) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        if (type != null) {
            return taxDeclarationRepository.findByOrganizationIdAndDeclarationTypeAndDeletedFalse(organizationId, type, pageable)
                    .map(TaxDeclarationResponse::fromEntity);
        }
        if (status != null) {
            return taxDeclarationRepository.findByOrganizationIdAndStatusAndDeletedFalse(organizationId, status, pageable)
                    .map(TaxDeclarationResponse::fromEntity);
        }
        return taxDeclarationRepository.findByOrganizationIdAndDeletedFalse(organizationId, pageable)
                .map(TaxDeclarationResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public TaxDeclarationResponse getDeclaration(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        TaxDeclaration declaration = getDeclarationOrThrow(id, organizationId);
        return TaxDeclarationResponse.fromEntity(declaration);
    }

    @Transactional
    public TaxDeclarationResponse createDeclaration(CreateTaxDeclarationRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        AccountPeriod period = accountPeriodRepository.findByIdAndOrganizationIdAndDeletedFalse(request.periodId(), organizationId)
                .orElseThrow(() -> new EntityNotFoundException("Период не найден: " + request.periodId()));

        TaxDeclaration declaration = TaxDeclaration.builder()
                .organizationId(organizationId)
                .declarationType(request.declarationType())
                .periodId(period.getId())
                .status(DeclarationStatus.DRAFT)
                .amount(request.amount() != null ? request.amount() : BigDecimal.ZERO)
                .notes(request.notes())
                .build();

        declaration = taxDeclarationRepository.save(declaration);
        auditService.logCreate("TaxDeclaration", declaration.getId());

        log.info("Налоговая декларация создана: {} ({})",
                declaration.getDeclarationType().getDisplayName(), declaration.getId());
        return TaxDeclarationResponse.fromEntity(declaration);
    }

    @Transactional
    public TaxDeclarationResponse submitDeclaration(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        TaxDeclaration declaration = getDeclarationOrThrow(id, organizationId);
        DeclarationStatus oldStatus = declaration.getStatus();

        if (!declaration.canTransitionTo(DeclarationStatus.SUBMITTED)) {
            throw new IllegalStateException(
                    String.format("Невозможно подать декларацию из статуса %s", oldStatus.getDisplayName()));
        }

        // Must be calculated first
        if (oldStatus == DeclarationStatus.DRAFT) {
            declaration.setStatus(DeclarationStatus.CALCULATED);
        }
        declaration.setStatus(DeclarationStatus.SUBMITTED);
        declaration.setSubmittedAt(Instant.now());
        declaration = taxDeclarationRepository.save(declaration);
        auditService.logStatusChange("TaxDeclaration", declaration.getId(),
                oldStatus.name(), DeclarationStatus.SUBMITTED.name());

        log.info("Декларация подана: {}", declaration.getId());
        return TaxDeclarationResponse.fromEntity(declaration);
    }

    @Transactional
    public TaxDeclarationResponse acceptDeclaration(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        TaxDeclaration declaration = getDeclarationOrThrow(id, organizationId);
        DeclarationStatus oldStatus = declaration.getStatus();

        if (!declaration.canTransitionTo(DeclarationStatus.ACCEPTED)) {
            throw new IllegalStateException(
                    String.format("Невозможно принять декларацию из статуса %s", oldStatus.getDisplayName()));
        }

        declaration.setStatus(DeclarationStatus.ACCEPTED);
        declaration.setAcceptedAt(Instant.now());
        declaration = taxDeclarationRepository.save(declaration);
        auditService.logStatusChange("TaxDeclaration", declaration.getId(),
                oldStatus.name(), DeclarationStatus.ACCEPTED.name());

        log.info("Декларация принята: {}", declaration.getId());
        return TaxDeclarationResponse.fromEntity(declaration);
    }

    @Transactional
    public TaxDeclarationResponse updateDeclaration(UUID id, CreateTaxDeclarationRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        TaxDeclaration declaration = getDeclarationOrThrow(id, organizationId);

        if (request.declarationType() != null) declaration.setDeclarationType(request.declarationType());
        if (request.periodId() != null) {
            AccountPeriod period = accountPeriodRepository.findByIdAndOrganizationIdAndDeletedFalse(request.periodId(), organizationId)
                    .orElseThrow(() -> new EntityNotFoundException("Период не найден: " + request.periodId()));
            declaration.setPeriodId(period.getId());
        }
        if (request.amount() != null) declaration.setAmount(request.amount());
        if (request.notes() != null) declaration.setNotes(request.notes());

        declaration = taxDeclarationRepository.save(declaration);
        auditService.logUpdate("TaxDeclaration", declaration.getId(), "multiple", null, null);

        log.info("Налоговая декларация обновлена: {}", declaration.getId());
        return TaxDeclarationResponse.fromEntity(declaration);
    }

    @Transactional
    public void deleteDeclaration(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        TaxDeclaration declaration = getDeclarationOrThrow(id, organizationId);
        declaration.softDelete();
        taxDeclarationRepository.save(declaration);
        auditService.logDelete("TaxDeclaration", id);
        log.info("Налоговая декларация удалена: {}", id);
    }

    /**
     * P1-FIN-5: Auto-calculate tax amount from invoice data.
     * VAT: output VAT (issued invoices) - input VAT (received invoices).
     * Profit: (revenue - costs) × 20%.
     * Updates declaration.amount and transitions status to CALCULATED.
     */
    @Transactional
    public TaxDeclarationResponse calculateDeclaration(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        TaxDeclaration declaration = getDeclarationOrThrow(id, organizationId);

        if (declaration.getStatus() != DeclarationStatus.DRAFT) {
            throw new IllegalStateException("Расчёт возможен только для деклараций в статусе DRAFT");
        }

        UUID periodId = declaration.getPeriodId();
        AccountPeriod period = accountPeriodRepository.findByIdAndOrganizationIdAndDeletedFalse(periodId, organizationId)
                .orElseThrow(() -> new EntityNotFoundException("Период не найден: " + periodId));

        LocalDate periodStart = LocalDate.of(period.getYear(), period.getMonth(), 1);
        LocalDate periodEnd = periodStart.withDayOfMonth(periodStart.lengthOfMonth());

        BigDecimal calculatedAmount;

        switch (declaration.getDeclarationType()) {
            case VAT -> {
                // Output VAT: issued invoices (to customers) — НДС с реализации
                BigDecimal outputVat = invoiceRepository.sumVatAmountByOrgAndTypeAndDateRange(
                        organizationId, InvoiceType.ISSUED, periodStart, periodEnd);
                // Input VAT: received invoices (from suppliers) — НДС к вычету
                BigDecimal inputVat = invoiceRepository.sumVatAmountByOrgAndTypeAndDateRange(
                        organizationId, InvoiceType.RECEIVED, periodStart, periodEnd);
                calculatedAmount = outputVat.subtract(inputVat).max(BigDecimal.ZERO);
                log.info("VAT declaration {}: outputVAT={}, inputVAT={}, net={}",
                        id, outputVat, inputVat, calculatedAmount);
            }
            case PROFIT -> {
                // Revenue: issued invoices total — выручка
                BigDecimal revenue = invoiceRepository.sumTotalAmountByOrgAndTypeAndDateRange(
                        organizationId, InvoiceType.ISSUED, periodStart, periodEnd);
                // Costs: received invoices total — расходы
                BigDecimal costs = invoiceRepository.sumTotalAmountByOrgAndTypeAndDateRange(
                        organizationId, InvoiceType.RECEIVED, periodStart, periodEnd);
                BigDecimal taxableProfit = revenue.subtract(costs).max(BigDecimal.ZERO);
                // Profit tax rate 20% (НК РФ ст.284)
                calculatedAmount = taxableProfit.multiply(new BigDecimal("0.20")).setScale(2, RoundingMode.HALF_UP);
                log.info("Profit declaration {}: revenue={}, costs={}, taxableProfit={}, tax={}",
                        id, revenue, costs, taxableProfit, calculatedAmount);
            }
            case USN -> {
                // УСН 6% от доходов (доходная база)
                BigDecimal usn6Revenue = invoiceRepository.sumTotalAmountByOrgAndTypeAndDateRange(
                        organizationId, InvoiceType.ISSUED, periodStart, periodEnd);
                calculatedAmount = usn6Revenue.multiply(new BigDecimal("0.06")).setScale(2, RoundingMode.HALF_UP);
                log.info("USN declaration {}: revenue={}, tax={}", id, usn6Revenue, calculatedAmount);
            }
            default -> {
                // PROPERTY and other types — manual calculation required, leave as-is
                calculatedAmount = declaration.getAmount();
                log.info("Declaration type {} requires manual calculation, amount unchanged: {}",
                        declaration.getDeclarationType(), calculatedAmount);
            }
        }

        declaration.setAmount(calculatedAmount);
        declaration.setStatus(DeclarationStatus.CALCULATED);
        declaration = taxDeclarationRepository.save(declaration);
        auditService.logStatusChange("TaxDeclaration", declaration.getId(),
                DeclarationStatus.DRAFT.name(), DeclarationStatus.CALCULATED.name());

        log.info("Tax declaration {} calculated: type={}, period={}/{}, amount={}",
                id, declaration.getDeclarationType(), period.getYear(), period.getMonth(), calculatedAmount);
        return TaxDeclarationResponse.fromEntity(declaration);
    }

    private TaxDeclaration getDeclarationOrThrow(UUID id, UUID organizationId) {
        return taxDeclarationRepository.findByIdAndOrganizationIdAndDeletedFalse(id, organizationId)
                .orElseThrow(() -> new EntityNotFoundException("Декларация не найдена: " + id));
    }
}
