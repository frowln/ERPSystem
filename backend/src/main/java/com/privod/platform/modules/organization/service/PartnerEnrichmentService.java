package com.privod.platform.modules.organization.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.organization.domain.EnrichmentLogStatus;
import com.privod.platform.modules.organization.domain.EnrichmentSource;
import com.privod.platform.modules.organization.domain.PartnerEnrichment;
import com.privod.platform.modules.organization.domain.PartnerEnrichmentLog;
import com.privod.platform.modules.organization.domain.PartnerLegalStatus;
import com.privod.platform.modules.organization.repository.PartnerEnrichmentLogRepository;
import com.privod.platform.modules.organization.repository.PartnerEnrichmentRepository;
import com.privod.platform.modules.organization.web.dto.CreatePartnerEnrichmentRequest;
import com.privod.platform.modules.organization.web.dto.PartnerEnrichmentLogResponse;
import com.privod.platform.modules.organization.web.dto.PartnerEnrichmentResponse;
import com.privod.platform.modules.organization.web.dto.UpdatePartnerEnrichmentRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PartnerEnrichmentService {

    private final PartnerEnrichmentRepository enrichmentRepository;
    private final PartnerEnrichmentLogRepository logRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public PartnerEnrichmentResponse findById(UUID id) {
        PartnerEnrichment enrichment = getEnrichmentOrThrow(id);
        return PartnerEnrichmentResponse.fromEntity(enrichment);
    }

    @Transactional(readOnly = true)
    public Optional<PartnerEnrichmentResponse> findByPartnerId(UUID partnerId) {
        return enrichmentRepository.findByPartnerIdAndDeletedFalse(partnerId)
                .map(PartnerEnrichmentResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public Optional<PartnerEnrichmentResponse> findByInn(String inn) {
        return enrichmentRepository.findByInnAndDeletedFalse(inn)
                .map(PartnerEnrichmentResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public Page<PartnerEnrichmentResponse> findByFilters(PartnerLegalStatus status,
                                                          EnrichmentSource source,
                                                          Pageable pageable) {
        return enrichmentRepository.findByFilters(status, source, pageable)
                .map(PartnerEnrichmentResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public List<PartnerEnrichmentResponse> findLowReliabilityPartners(int threshold) {
        return enrichmentRepository.findLowReliabilityPartners(threshold)
                .stream()
                .map(PartnerEnrichmentResponse::fromEntity)
                .toList();
    }

    @Transactional
    public PartnerEnrichmentResponse create(CreatePartnerEnrichmentRequest request) {
        PartnerEnrichment enrichment = PartnerEnrichment.builder()
                .partnerId(request.partnerId())
                .inn(request.inn())
                .ogrn(request.ogrn())
                .kpp(request.kpp())
                .legalName(request.legalName())
                .tradeName(request.tradeName())
                .legalAddress(request.legalAddress())
                .actualAddress(request.actualAddress())
                .registrationDate(request.registrationDate())
                .status(request.status() != null ? request.status() : PartnerLegalStatus.ACTIVE)
                .authorizedCapital(request.authorizedCapital())
                .ceoName(request.ceoName())
                .ceoInn(request.ceoInn())
                .employeeCount(request.employeeCount())
                .mainActivity(request.mainActivity())
                .okvedCode(request.okvedCode())
                .enrichedAt(Instant.now())
                .source(request.source() != null ? request.source() : EnrichmentSource.MANUAL)
                .reliabilityScore(request.reliabilityScore() != null ? request.reliabilityScore() : 0)
                .build();

        enrichment = enrichmentRepository.save(enrichment);
        auditService.logCreate("PartnerEnrichment", enrichment.getId());

        logEnrichmentAction(enrichment.getPartnerId(), enrichment.getSource().name(),
                EnrichmentLogStatus.SUCCESS, null, null);

        log.info("Partner enrichment created for partner {}: {} ({})",
                enrichment.getPartnerId(), enrichment.getLegalName(), enrichment.getId());
        return PartnerEnrichmentResponse.fromEntity(enrichment);
    }

    @Transactional
    public PartnerEnrichmentResponse update(UUID id, UpdatePartnerEnrichmentRequest request) {
        PartnerEnrichment enrichment = getEnrichmentOrThrow(id);

        if (request.inn() != null) {
            enrichment.setInn(request.inn());
        }
        if (request.ogrn() != null) {
            enrichment.setOgrn(request.ogrn());
        }
        if (request.kpp() != null) {
            enrichment.setKpp(request.kpp());
        }
        if (request.legalName() != null) {
            enrichment.setLegalName(request.legalName());
        }
        if (request.tradeName() != null) {
            enrichment.setTradeName(request.tradeName());
        }
        if (request.legalAddress() != null) {
            enrichment.setLegalAddress(request.legalAddress());
        }
        if (request.actualAddress() != null) {
            enrichment.setActualAddress(request.actualAddress());
        }
        if (request.registrationDate() != null) {
            enrichment.setRegistrationDate(request.registrationDate());
        }
        if (request.status() != null) {
            enrichment.setStatus(request.status());
        }
        if (request.authorizedCapital() != null) {
            enrichment.setAuthorizedCapital(request.authorizedCapital());
        }
        if (request.ceoName() != null) {
            enrichment.setCeoName(request.ceoName());
        }
        if (request.ceoInn() != null) {
            enrichment.setCeoInn(request.ceoInn());
        }
        if (request.employeeCount() != null) {
            enrichment.setEmployeeCount(request.employeeCount());
        }
        if (request.mainActivity() != null) {
            enrichment.setMainActivity(request.mainActivity());
        }
        if (request.okvedCode() != null) {
            enrichment.setOkvedCode(request.okvedCode());
        }
        if (request.source() != null) {
            enrichment.setSource(request.source());
        }
        if (request.reliabilityScore() != null) {
            enrichment.setReliabilityScore(request.reliabilityScore());
        }

        enrichment.setEnrichedAt(Instant.now());
        enrichment = enrichmentRepository.save(enrichment);
        auditService.logUpdate("PartnerEnrichment", enrichment.getId(), "multiple", null, null);

        log.info("Partner enrichment updated for partner {}: ({})",
                enrichment.getPartnerId(), enrichment.getId());
        return PartnerEnrichmentResponse.fromEntity(enrichment);
    }

    @Transactional
    public void delete(UUID id) {
        PartnerEnrichment enrichment = getEnrichmentOrThrow(id);
        enrichment.softDelete();
        enrichmentRepository.save(enrichment);
        auditService.logDelete("PartnerEnrichment", id);
        log.info("Partner enrichment soft-deleted: partner {} ({})", enrichment.getPartnerId(), id);
    }

    // --- Log operations ---

    @Transactional(readOnly = true)
    public Page<PartnerEnrichmentLogResponse> findLogsByPartner(UUID partnerId, Pageable pageable) {
        return logRepository.findByPartnerIdAndDeletedFalseOrderByRequestedAtDesc(partnerId, pageable)
                .map(PartnerEnrichmentLogResponse::fromEntity);
    }

    @Transactional
    public PartnerEnrichmentLogResponse logEnrichmentAction(UUID partnerId, String source,
                                                             EnrichmentLogStatus status,
                                                             String responseData, String errorMessage) {
        PartnerEnrichmentLog logEntry = PartnerEnrichmentLog.builder()
                .partnerId(partnerId)
                .source(source)
                .requestedAt(Instant.now())
                .status(status)
                .responseData(responseData)
                .errorMessage(errorMessage)
                .build();

        logEntry = logRepository.save(logEntry);
        log.info("Enrichment log recorded for partner {}: {} - {}",
                partnerId, source, status);
        return PartnerEnrichmentLogResponse.fromEntity(logEntry);
    }

    private PartnerEnrichment getEnrichmentOrThrow(UUID id) {
        return enrichmentRepository.findById(id)
                .filter(e -> !e.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Обогащение партнёра не найдено: " + id));
    }
}
