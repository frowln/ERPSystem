package com.privod.platform.modules.kep.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.kep.domain.MchDDocument;
import com.privod.platform.modules.kep.domain.MchDStatus;
import com.privod.platform.modules.kep.repository.MchDRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class MchDService {

    private final MchDRepository mchdRepository;
    private final AuditService auditService;

    // ===================== Inner DTOs =====================

    public record MchDResponse(
            UUID id,
            String number,
            String principalInn,
            String principalName,
            String representativeInn,
            String representativeName,
            String scope,
            Instant validFrom,
            Instant validTo,
            MchDStatus status,
            String registryId,
            UUID signingCertificateId,
            String notes,
            Instant createdAt
    ) {
        public static MchDResponse fromEntity(MchDDocument entity) {
            return new MchDResponse(
                    entity.getId(),
                    entity.getNumber(),
                    entity.getPrincipalInn(),
                    entity.getPrincipalName(),
                    entity.getRepresentativeInn(),
                    entity.getRepresentativeName(),
                    entity.getScope(),
                    entity.getValidFrom(),
                    entity.getValidTo(),
                    entity.getStatus(),
                    entity.getRegistryId(),
                    entity.getSigningCertificateId(),
                    entity.getNotes(),
                    entity.getCreatedAt()
            );
        }
    }

    public record CreateMchDRequest(
            @NotBlank(message = "Номер МЧД обязателен")
            String number,

            @NotBlank(message = "ИНН доверителя обязателен")
            String principalInn,

            @NotBlank(message = "Наименование доверителя обязательно")
            String principalName,

            @NotBlank(message = "ИНН представителя обязателен")
            String representativeInn,

            @NotBlank(message = "ФИО представителя обязательно")
            String representativeName,

            UUID representativeUserId,

            String scope,

            @NotNull(message = "Дата начала действия обязательна")
            Instant validFrom,

            @NotNull(message = "Дата окончания действия обязательна")
            Instant validTo,

            String notes
    ) {
    }

    public record UpdateMchDRequest(
            String scope,
            Instant validTo,
            String notes
    ) {
    }

    // ===================== Methods =====================

    public Page<MchDResponse> list(Pageable pageable) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        return mchdRepository.findByOrganizationIdAndDeletedFalse(orgId, pageable)
                .map(MchDResponse::fromEntity);
    }

    public MchDResponse getById(UUID id) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        MchDDocument doc = mchdRepository.findByIdAndOrganizationIdAndDeletedFalse(id, orgId)
                .orElseThrow(() -> new EntityNotFoundException("МЧД не найдена: " + id));
        return MchDResponse.fromEntity(doc);
    }

    @Transactional
    public MchDResponse create(@Valid CreateMchDRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        if (request.validTo().isBefore(request.validFrom())) {
            throw new IllegalArgumentException("Дата окончания действия должна быть позже даты начала");
        }

        MchDDocument doc = MchDDocument.builder()
                .organizationId(orgId)
                .number(request.number())
                .principalInn(request.principalInn())
                .principalName(request.principalName())
                .representativeInn(request.representativeInn())
                .representativeName(request.representativeName())
                .representativeUserId(request.representativeUserId())
                .scope(request.scope())
                .validFrom(request.validFrom())
                .validTo(request.validTo())
                .status(MchDStatus.ACTIVE)
                .notes(request.notes())
                .build();

        doc = mchdRepository.save(doc);
        auditService.logCreate("MchDDocument", doc.getId());

        log.info("MChD created: {} for representative {} ({})",
                doc.getNumber(), doc.getRepresentativeName(), doc.getId());
        return MchDResponse.fromEntity(doc);
    }

    @Transactional
    public MchDResponse update(UUID id, @Valid UpdateMchDRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        MchDDocument doc = mchdRepository.findByIdAndOrganizationIdAndDeletedFalse(id, orgId)
                .orElseThrow(() -> new EntityNotFoundException("МЧД не найдена: " + id));

        if (request.scope() != null) {
            doc.setScope(request.scope());
        }
        if (request.validTo() != null) {
            if (request.validTo().isBefore(doc.getValidFrom())) {
                throw new IllegalArgumentException("Дата окончания действия должна быть позже даты начала");
            }
            doc.setValidTo(request.validTo());
        }
        if (request.notes() != null) {
            doc.setNotes(request.notes());
        }

        doc = mchdRepository.save(doc);
        auditService.logUpdate("MchDDocument", doc.getId(), "multiple", null, null);

        log.info("MChD updated: {} ({})", doc.getNumber(), doc.getId());
        return MchDResponse.fromEntity(doc);
    }

    @Transactional
    public void revoke(UUID id) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        MchDDocument doc = mchdRepository.findByIdAndOrganizationIdAndDeletedFalse(id, orgId)
                .orElseThrow(() -> new EntityNotFoundException("МЧД не найдена: " + id));

        if (doc.getStatus() != MchDStatus.ACTIVE) {
            throw new IllegalStateException("Отозвать можно только действующую МЧД");
        }

        MchDStatus oldStatus = doc.getStatus();
        doc.setStatus(MchDStatus.REVOKED);
        mchdRepository.save(doc);
        auditService.logStatusChange("MchDDocument", doc.getId(),
                oldStatus.name(), MchDStatus.REVOKED.name());

        log.info("MChD revoked: {} ({})", doc.getNumber(), doc.getId());
    }

    @Transactional
    public void delete(UUID id) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        MchDDocument doc = mchdRepository.findByIdAndOrganizationIdAndDeletedFalse(id, orgId)
                .orElseThrow(() -> new EntityNotFoundException("МЧД не найдена: " + id));

        doc.softDelete();
        mchdRepository.save(doc);
        auditService.logDelete("MchDDocument", doc.getId());

        log.info("MChD deleted: {} ({})", doc.getNumber(), doc.getId());
    }

    @Transactional
    public void expireOverdue() {
        // Process each organization's overdue MChDs
        // In a multi-tenant system, this is typically called from a scheduled task
        // that iterates over all organizations, but here we handle it with a direct query
        List<MchDDocument> allActive = mchdRepository.findAll().stream()
                .filter(d -> !d.isDeleted()
                        && d.getStatus() == MchDStatus.ACTIVE
                        && d.getValidTo().isBefore(Instant.now()))
                .toList();

        for (MchDDocument doc : allActive) {
            MchDStatus oldStatus = doc.getStatus();
            doc.setStatus(MchDStatus.EXPIRED);
            mchdRepository.save(doc);
            auditService.logStatusChange("MchDDocument", doc.getId(),
                    oldStatus.name(), MchDStatus.EXPIRED.name());
            log.info("MChD expired: {} ({})", doc.getNumber(), doc.getId());
        }

        if (!allActive.isEmpty()) {
            log.info("Expired {} overdue MChD documents", allActive.size());
        }
    }
}
