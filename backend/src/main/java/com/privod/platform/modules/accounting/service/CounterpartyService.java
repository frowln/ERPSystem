package com.privod.platform.modules.accounting.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.accounting.domain.Counterparty;
import com.privod.platform.modules.accounting.repository.CounterpartyRepository;
import com.privod.platform.modules.accounting.web.dto.CounterpartyResponse;
import com.privod.platform.modules.accounting.web.dto.CreateCounterpartyRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CounterpartyService {

    private final CounterpartyRepository counterpartyRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<CounterpartyResponse> listCounterparties(String search, Pageable pageable) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        if (search != null && !search.isBlank()) {
            return counterpartyRepository.findByOrganizationIdAndNameContainingIgnoreCaseAndDeletedFalse(organizationId, search, pageable)
                    .map(CounterpartyResponse::fromEntity);
        }
        return counterpartyRepository.findByOrganizationIdAndDeletedFalse(organizationId, pageable)
                .map(CounterpartyResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public CounterpartyResponse getCounterparty(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        Counterparty counterparty = getCounterpartyOrThrow(id, organizationId);
        return CounterpartyResponse.fromEntity(counterparty);
    }

    @Transactional
    public CounterpartyResponse createCounterparty(CreateCounterpartyRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();

        counterpartyRepository.findByOrganizationIdAndInnAndDeletedFalse(organizationId, request.inn())
                .ifPresent(c -> {
                    throw new IllegalStateException("Контрагент с ИНН " + request.inn() + " уже существует");
                });

        Counterparty counterparty = Counterparty.builder()
                .organizationId(organizationId)
                .name(request.name())
                .shortName(request.shortName())
                .inn(request.inn())
                .kpp(request.kpp())
                .ogrn(request.ogrn())
                .legalAddress(request.legalAddress())
                .actualAddress(request.actualAddress())
                .bankAccount(request.bankAccount())
                .bik(request.bik())
                .correspondentAccount(request.correspondentAccount())
                .bankName(request.bankName())
                .contactPerson(request.contactPerson())
                .phone(request.phone())
                .email(request.email())
                .website(request.website())
                .supplier(request.supplier())
                .customer(request.customer())
                .contractor(request.contractor())
                .subcontractor(request.subcontractor())
                .designer(request.designer())
                .notes(request.notes())
                .active(true)
                .build();

        counterparty = counterpartyRepository.save(counterparty);
        auditService.logCreate("Counterparty", counterparty.getId());

        log.info("Контрагент создан: {} (ИНН {})", counterparty.getName(), counterparty.getInn());
        return CounterpartyResponse.fromEntity(counterparty);
    }

    @Transactional
    public CounterpartyResponse updateCounterparty(UUID id, CreateCounterpartyRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        Counterparty counterparty = getCounterpartyOrThrow(id, organizationId);

        if (request.inn() != null && !request.inn().equals(counterparty.getInn())) {
            counterpartyRepository.findByOrganizationIdAndInnAndDeletedFalse(organizationId, request.inn())
                    .filter(existing -> !existing.getId().equals(id))
                    .ifPresent(existing -> {
                        throw new IllegalStateException("Контрагент с ИНН " + request.inn() + " уже существует");
                    });
        }

        if (request.name() != null) counterparty.setName(request.name());
        if (request.shortName() != null) counterparty.setShortName(request.shortName());
        if (request.inn() != null) counterparty.setInn(request.inn());
        if (request.kpp() != null) counterparty.setKpp(request.kpp());
        if (request.ogrn() != null) counterparty.setOgrn(request.ogrn());
        if (request.legalAddress() != null) counterparty.setLegalAddress(request.legalAddress());
        if (request.actualAddress() != null) counterparty.setActualAddress(request.actualAddress());
        if (request.bankAccount() != null) counterparty.setBankAccount(request.bankAccount());
        if (request.bik() != null) counterparty.setBik(request.bik());
        if (request.correspondentAccount() != null) counterparty.setCorrespondentAccount(request.correspondentAccount());
        if (request.bankName() != null) counterparty.setBankName(request.bankName());
        if (request.contactPerson() != null) counterparty.setContactPerson(request.contactPerson());
        if (request.phone() != null) counterparty.setPhone(request.phone());
        if (request.email() != null) counterparty.setEmail(request.email());
        if (request.website() != null) counterparty.setWebsite(request.website());
        counterparty.setSupplier(request.supplier());
        counterparty.setCustomer(request.customer());
        counterparty.setContractor(request.contractor());
        counterparty.setSubcontractor(request.subcontractor());
        counterparty.setDesigner(request.designer());
        if (request.notes() != null) counterparty.setNotes(request.notes());

        counterparty = counterpartyRepository.save(counterparty);
        auditService.logUpdate("Counterparty", counterparty.getId(), "multiple", null, null);

        log.info("Контрагент обновлён: {} ({})", counterparty.getName(), counterparty.getId());
        return CounterpartyResponse.fromEntity(counterparty);
    }

    @Transactional
    public void deactivateCounterparty(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        Counterparty counterparty = getCounterpartyOrThrow(id, organizationId);
        counterparty.setActive(false);
        counterpartyRepository.save(counterparty);
        auditService.logUpdate("Counterparty", id, "is_active", "true", "false");

        log.info("Контрагент деактивирован: {} ({})", counterparty.getName(), id);
    }

    private Counterparty getCounterpartyOrThrow(UUID id, UUID organizationId) {
        return counterpartyRepository.findByIdAndOrganizationIdAndDeletedFalse(id, organizationId)
                .orElseThrow(() -> new EntityNotFoundException("Контрагент не найден: " + id));
    }
}
