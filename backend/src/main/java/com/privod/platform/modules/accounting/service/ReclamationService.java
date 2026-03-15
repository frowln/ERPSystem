package com.privod.platform.modules.accounting.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.accounting.domain.Reclamation;
import com.privod.platform.modules.accounting.domain.ReclamationStatus;
import com.privod.platform.modules.accounting.repository.ReclamationRepository;
import com.privod.platform.modules.accounting.web.dto.CreateReclamationRequest;
import com.privod.platform.modules.accounting.web.dto.ReclamationResponse;
import com.privod.platform.modules.accounting.web.dto.UpdateReclamationRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReclamationService {

    private final ReclamationRepository reclamationRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<ReclamationResponse> list(UUID projectId, ReclamationStatus status, Pageable pageable) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();

        if (projectId != null) {
            return reclamationRepository.findByOrganizationIdAndProjectIdAndDeletedFalse(organizationId, projectId, pageable)
                    .map(ReclamationResponse::fromEntity);
        }
        if (status != null) {
            return reclamationRepository.findByOrganizationIdAndStatusAndDeletedFalse(organizationId, status, pageable)
                    .map(ReclamationResponse::fromEntity);
        }
        return reclamationRepository.findByOrganizationIdAndDeletedFalse(organizationId, pageable)
                .map(ReclamationResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public ReclamationResponse getById(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        Reclamation reclamation = getOrThrow(id, organizationId);
        return ReclamationResponse.fromEntity(reclamation);
    }

    @Transactional
    public ReclamationResponse create(CreateReclamationRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();

        Reclamation reclamation = Reclamation.builder()
                .organizationId(organizationId)
                .contractId(request.contractId())
                .counterpartyId(request.counterpartyId())
                .projectId(request.projectId())
                .claimNumber(request.claimNumber())
                .claimDate(request.claimDate() != null ? request.claimDate() : LocalDate.now())
                .deadline(request.deadline() != null ? request.deadline() : LocalDate.now().plusDays(30))
                .subject(request.subject())
                .description(request.description())
                .amount(request.amount())
                .status(ReclamationStatus.DRAFT)
                .build();

        reclamation = reclamationRepository.save(reclamation);
        auditService.logCreate("Reclamation", reclamation.getId());

        log.info("Рекламация создана: {} ({})", reclamation.getSubject(), reclamation.getId());
        return ReclamationResponse.fromEntity(reclamation);
    }

    @Transactional
    public ReclamationResponse update(UUID id, UpdateReclamationRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        Reclamation reclamation = getOrThrow(id, organizationId);

        if (request.contractId() != null) {
            reclamation.setContractId(request.contractId());
        }
        if (request.counterpartyId() != null) {
            reclamation.setCounterpartyId(request.counterpartyId());
        }
        if (request.projectId() != null) {
            reclamation.setProjectId(request.projectId());
        }
        if (request.claimNumber() != null) {
            reclamation.setClaimNumber(request.claimNumber());
        }
        if (request.claimDate() != null) {
            reclamation.setClaimDate(request.claimDate());
        }
        if (request.deadline() != null) {
            reclamation.setDeadline(request.deadline());
        }
        if (request.subject() != null) {
            reclamation.setSubject(request.subject());
        }
        if (request.description() != null) {
            reclamation.setDescription(request.description());
        }
        if (request.amount() != null) {
            reclamation.setAmount(request.amount());
        }
        if (request.resolution() != null) {
            reclamation.setResolution(request.resolution());
        }
        if (request.status() != null) {
            ReclamationStatus oldStatus = reclamation.getStatus();
            reclamation.setStatus(request.status());
            if (request.status() == ReclamationStatus.RESOLVED) {
                reclamation.setResolvedAt(Instant.now());
            }
            auditService.logStatusChange("Reclamation", id, oldStatus.name(), request.status().name());
        }

        reclamation = reclamationRepository.save(reclamation);
        auditService.logUpdate("Reclamation", id, "multiple", null, null);

        log.info("Рекламация обновлена: {} ({})", reclamation.getSubject(), reclamation.getId());
        return ReclamationResponse.fromEntity(reclamation);
    }

    @Transactional
    public void delete(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        Reclamation reclamation = getOrThrow(id, organizationId);
        reclamation.softDelete();
        reclamationRepository.save(reclamation);
        auditService.logDelete("Reclamation", id);
        log.info("Рекламация удалена: {} ({})", reclamation.getSubject(), id);
    }

    private Reclamation getOrThrow(UUID id, UUID organizationId) {
        return reclamationRepository.findByIdAndOrganizationIdAndDeletedFalse(id, organizationId)
                .orElseThrow(() -> new EntityNotFoundException("Рекламация не найдена: " + id));
    }
}
