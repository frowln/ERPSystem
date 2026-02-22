package com.privod.platform.modules.closeout.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.closeout.domain.WarrantyObligation;
import com.privod.platform.modules.closeout.domain.WarrantyObligationStatus;
import com.privod.platform.modules.closeout.repository.WarrantyClaimRepository;
import com.privod.platform.modules.closeout.repository.WarrantyObligationRepository;
import com.privod.platform.modules.closeout.web.dto.CreateWarrantyObligationRequest;
import com.privod.platform.modules.closeout.web.dto.UpdateWarrantyObligationRequest;
import com.privod.platform.modules.closeout.web.dto.WarrantyObligationResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class WarrantyObligationService {

    private final WarrantyObligationRepository obligationRepository;
    private final WarrantyClaimRepository claimRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<WarrantyObligationResponse> findAll(Pageable pageable) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        return obligationRepository.findByOrganizationIdAndDeletedFalse(orgId, pageable)
                .map(entity -> WarrantyObligationResponse.fromEntity(entity, 0));
    }

    @Transactional(readOnly = true)
    public List<WarrantyObligationResponse> findByProject(UUID projectId) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        return obligationRepository.findByOrganizationIdAndProjectIdAndDeletedFalse(orgId, projectId)
                .stream()
                .map(entity -> WarrantyObligationResponse.fromEntity(entity, 0))
                .toList();
    }

    @Transactional(readOnly = true)
    public WarrantyObligationResponse findById(UUID id) {
        WarrantyObligation obligation = getOrThrow(id);
        return WarrantyObligationResponse.fromEntity(obligation, 0);
    }

    @Transactional
    public WarrantyObligationResponse create(CreateWarrantyObligationRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        WarrantyObligation obligation = WarrantyObligation.builder()
                .organizationId(orgId)
                .projectId(request.projectId())
                .handoverPackageId(request.handoverPackageId())
                .title(request.title())
                .description(request.description())
                .system(request.system())
                .warrantyStartDate(request.warrantyStartDate())
                .warrantyEndDate(request.warrantyEndDate())
                .contractorName(request.contractorName())
                .contractorContactInfo(request.contractorContactInfo())
                .coverageTerms(request.coverageTerms())
                .exclusions(request.exclusions())
                .notes(request.notes())
                .status(WarrantyObligationStatus.ACTIVE)
                .build();

        obligation = obligationRepository.save(obligation);
        auditService.logCreate("WarrantyObligation", obligation.getId());

        log.info("Гарантийное обязательство создано: {} ({})", obligation.getTitle(), obligation.getId());
        return WarrantyObligationResponse.fromEntity(obligation, 0);
    }

    @Transactional
    public WarrantyObligationResponse update(UUID id, UpdateWarrantyObligationRequest request) {
        WarrantyObligation obligation = getOrThrow(id);

        if (request.projectId() != null) {
            obligation.setProjectId(request.projectId());
        }
        if (request.handoverPackageId() != null) {
            obligation.setHandoverPackageId(request.handoverPackageId());
        }
        if (request.title() != null) {
            obligation.setTitle(request.title());
        }
        if (request.description() != null) {
            obligation.setDescription(request.description());
        }
        if (request.system() != null) {
            obligation.setSystem(request.system());
        }
        if (request.warrantyStartDate() != null) {
            obligation.setWarrantyStartDate(request.warrantyStartDate());
        }
        if (request.warrantyEndDate() != null) {
            obligation.setWarrantyEndDate(request.warrantyEndDate());
        }
        if (request.contractorName() != null) {
            obligation.setContractorName(request.contractorName());
        }
        if (request.contractorContactInfo() != null) {
            obligation.setContractorContactInfo(request.contractorContactInfo());
        }
        if (request.coverageTerms() != null) {
            obligation.setCoverageTerms(request.coverageTerms());
        }
        if (request.exclusions() != null) {
            obligation.setExclusions(request.exclusions());
        }
        if (request.notes() != null) {
            obligation.setNotes(request.notes());
        }
        if (request.status() != null) {
            WarrantyObligationStatus oldStatus = obligation.getStatus();
            obligation.setStatus(request.status());
            auditService.logStatusChange("WarrantyObligation", id, oldStatus.name(), request.status().name());
        }

        obligation = obligationRepository.save(obligation);
        auditService.logUpdate("WarrantyObligation", id, "multiple", null, null);

        log.info("Гарантийное обязательство обновлено: {} ({})", obligation.getTitle(), obligation.getId());
        return WarrantyObligationResponse.fromEntity(obligation, 0);
    }

    @Transactional
    public void delete(UUID id) {
        WarrantyObligation obligation = getOrThrow(id);
        obligation.softDelete();
        obligationRepository.save(obligation);
        auditService.logDelete("WarrantyObligation", id);
        log.info("Гарантийное обязательство удалено: {} ({})", obligation.getTitle(), id);
    }

    @Transactional(readOnly = true)
    public WarrantyDashboardResponse getDashboardSummary() {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        long totalActive = obligationRepository.countByOrganizationIdAndStatusAndDeletedFalse(
                orgId, WarrantyObligationStatus.ACTIVE);
        long totalExpiringSoon = obligationRepository.countByOrganizationIdAndStatusAndDeletedFalse(
                orgId, WarrantyObligationStatus.EXPIRING_SOON);
        long totalExpired = obligationRepository.countByOrganizationIdAndStatusAndDeletedFalse(
                orgId, WarrantyObligationStatus.EXPIRED);

        LocalDate soon = LocalDate.now().plusDays(30);
        List<WarrantyObligationResponse> upcomingExpirations = obligationRepository
                .findByOrganizationIdAndWarrantyEndDateBeforeAndStatusAndDeletedFalse(
                        orgId, soon, WarrantyObligationStatus.ACTIVE)
                .stream()
                .map(entity -> WarrantyObligationResponse.fromEntity(entity, 0))
                .toList();

        return new WarrantyDashboardResponse(totalActive, totalExpiringSoon, totalExpired, upcomingExpirations);
    }

    private WarrantyObligation getOrThrow(UUID id) {
        return obligationRepository.findById(id)
                .filter(o -> !o.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Гарантийное обязательство не найдено: " + id));
    }

    public record WarrantyDashboardResponse(
            long totalActive,
            long totalExpiringSoon,
            long totalExpired,
            List<WarrantyObligationResponse> upcomingExpirations
    ) {
    }
}
