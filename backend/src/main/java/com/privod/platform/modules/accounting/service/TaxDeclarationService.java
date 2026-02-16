package com.privod.platform.modules.accounting.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.accounting.domain.DeclarationStatus;
import com.privod.platform.modules.accounting.domain.DeclarationType;
import com.privod.platform.modules.accounting.domain.AccountPeriod;
import com.privod.platform.modules.accounting.domain.TaxDeclaration;
import com.privod.platform.modules.accounting.repository.AccountPeriodRepository;
import com.privod.platform.modules.accounting.repository.TaxDeclarationRepository;
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
import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TaxDeclarationService {

    private final TaxDeclarationRepository taxDeclarationRepository;
    private final AccountPeriodRepository accountPeriodRepository;
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

    private TaxDeclaration getDeclarationOrThrow(UUID id, UUID organizationId) {
        return taxDeclarationRepository.findByIdAndOrganizationIdAndDeletedFalse(id, organizationId)
                .orElseThrow(() -> new EntityNotFoundException("Декларация не найдена: " + id));
    }
}
