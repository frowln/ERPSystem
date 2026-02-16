package com.privod.platform.modules.portfolio.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.portfolio.domain.BidPackage;
import com.privod.platform.modules.portfolio.domain.BidStatus;
import com.privod.platform.modules.portfolio.domain.ClientType;
import com.privod.platform.modules.portfolio.domain.Opportunity;
import com.privod.platform.modules.portfolio.domain.OpportunityStage;
import com.privod.platform.modules.portfolio.domain.Prequalification;
import com.privod.platform.modules.portfolio.domain.PrequalificationStatus;
import com.privod.platform.modules.portfolio.domain.TenderSubmission;
import com.privod.platform.modules.portfolio.repository.BidPackageRepository;
import com.privod.platform.modules.portfolio.repository.OpportunityRepository;
import com.privod.platform.modules.portfolio.repository.PrequalificationRepository;
import com.privod.platform.modules.portfolio.repository.TenderSubmissionRepository;
import com.privod.platform.modules.portfolio.web.dto.BidPackageResponse;
import com.privod.platform.modules.portfolio.web.dto.ChangeOpportunityStageRequest;
import com.privod.platform.modules.portfolio.web.dto.CreateBidPackageRequest;
import com.privod.platform.modules.portfolio.web.dto.CreateOpportunityRequest;
import com.privod.platform.modules.portfolio.web.dto.CreatePrequalificationRequest;
import com.privod.platform.modules.portfolio.web.dto.CreateTenderSubmissionRequest;
import com.privod.platform.modules.portfolio.web.dto.OpportunityResponse;
import com.privod.platform.modules.portfolio.web.dto.PortfolioDashboardResponse;
import com.privod.platform.modules.portfolio.web.dto.PrequalificationResponse;
import com.privod.platform.modules.portfolio.web.dto.TenderSubmissionResponse;
import com.privod.platform.modules.portfolio.web.dto.UpdateBidPackageRequest;
import com.privod.platform.modules.portfolio.web.dto.UpdateOpportunityRequest;
import com.privod.platform.modules.portfolio.web.dto.UpdatePrequalificationRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PortfolioService {

    private final OpportunityRepository opportunityRepository;
    private final BidPackageRepository bidPackageRepository;
    private final PrequalificationRepository prequalificationRepository;
    private final TenderSubmissionRepository tenderSubmissionRepository;
    private final AuditService auditService;

    // ======================== Opportunity ========================

    @Transactional(readOnly = true)
    public Page<OpportunityResponse> listOpportunities(String search, OpportunityStage stage,
                                                        ClientType clientType, UUID organizationId,
                                                        Pageable pageable) {
        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();
        if (organizationId != null && !organizationId.equals(currentOrgId)) {
            throw new AccessDeniedException("Cannot access opportunities for another organization");
        }

        Specification<Opportunity> spec = Specification.where(OpportunitySpecification.notDeleted())
                .and(OpportunitySpecification.hasStage(stage))
                .and(OpportunitySpecification.hasClientType(clientType))
                .and(OpportunitySpecification.belongsToOrganization(currentOrgId))
                .and(OpportunitySpecification.searchByName(search));

        return opportunityRepository.findAll(spec, pageable).map(OpportunityResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public OpportunityResponse getOpportunity(UUID id) {
        Opportunity opportunity = getOpportunityOrThrow(id);
        return OpportunityResponse.fromEntity(opportunity);
    }

    @Transactional
    public OpportunityResponse createOpportunity(CreateOpportunityRequest request) {
        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();
        if (request.organizationId() != null && !request.organizationId().equals(currentOrgId)) {
            throw new AccessDeniedException("Cannot create opportunity in another organization");
        }

        Opportunity opportunity = Opportunity.builder()
                .organizationId(currentOrgId)
                .name(request.name())
                .description(request.description())
                .clientName(request.clientName())
                .clientType(request.clientType())
                .stage(OpportunityStage.LEAD)
                .estimatedValue(request.estimatedValue())
                .probability(request.probability())
                .expectedCloseDate(request.expectedCloseDate())
                .ownerId(request.ownerId())
                .source(request.source())
                .region(request.region())
                .projectType(request.projectType())
                .tags(request.tags())
                .build();

        opportunity = opportunityRepository.save(opportunity);
        auditService.logCreate("Opportunity", opportunity.getId());

        log.info("Opportunity created: {} ({})", opportunity.getName(), opportunity.getId());
        return OpportunityResponse.fromEntity(opportunity);
    }

    @Transactional
    public OpportunityResponse updateOpportunity(UUID id, UpdateOpportunityRequest request) {
        Opportunity opportunity = getOpportunityOrThrow(id);

        if (request.name() != null) {
            opportunity.setName(request.name());
        }
        if (request.description() != null) {
            opportunity.setDescription(request.description());
        }
        if (request.clientName() != null) {
            opportunity.setClientName(request.clientName());
        }
        if (request.clientType() != null) {
            opportunity.setClientType(request.clientType());
        }
        if (request.estimatedValue() != null) {
            opportunity.setEstimatedValue(request.estimatedValue());
        }
        if (request.probability() != null) {
            opportunity.setProbability(request.probability());
        }
        if (request.expectedCloseDate() != null) {
            opportunity.setExpectedCloseDate(request.expectedCloseDate());
        }
        if (request.ownerId() != null) {
            opportunity.setOwnerId(request.ownerId());
        }
        if (request.source() != null) {
            opportunity.setSource(request.source());
        }
        if (request.region() != null) {
            opportunity.setRegion(request.region());
        }
        if (request.projectType() != null) {
            opportunity.setProjectType(request.projectType());
        }
        if (request.tags() != null) {
            opportunity.setTags(request.tags());
        }

        opportunity = opportunityRepository.save(opportunity);
        auditService.logUpdate("Opportunity", opportunity.getId(), "multiple", null, null);

        log.info("Opportunity updated: {} ({})", opportunity.getName(), opportunity.getId());
        return OpportunityResponse.fromEntity(opportunity);
    }

    @Transactional
    public OpportunityResponse changeStage(UUID id, ChangeOpportunityStageRequest request) {
        Opportunity opportunity = getOpportunityOrThrow(id);
        OpportunityStage oldStage = opportunity.getStage();
        OpportunityStage newStage = request.stage();

        if (!opportunity.canTransitionTo(newStage)) {
            throw new IllegalStateException(
                    String.format("Невозможно перевести возможность из этапа %s в %s",
                            oldStage.getDisplayName(), newStage.getDisplayName()));
        }

        opportunity.setStage(newStage);

        if (newStage == OpportunityStage.LOST) {
            opportunity.setLostReason(request.lostReason());
            opportunity.setActualCloseDate(LocalDate.now());
        }

        if (newStage == OpportunityStage.WON) {
            opportunity.setWonProjectId(request.wonProjectId());
            opportunity.setActualCloseDate(LocalDate.now());
            opportunity.setProbability(100);
        }

        if (newStage == OpportunityStage.WITHDRAWN) {
            opportunity.setActualCloseDate(LocalDate.now());
        }

        opportunity = opportunityRepository.save(opportunity);
        auditService.logStatusChange("Opportunity", opportunity.getId(), oldStage.name(), newStage.name());

        log.info("Opportunity stage changed: {} from {} to {} ({})",
                opportunity.getName(), oldStage, newStage, opportunity.getId());
        return OpportunityResponse.fromEntity(opportunity);
    }

    @Transactional
    public void deleteOpportunity(UUID id) {
        Opportunity opportunity = getOpportunityOrThrow(id);
        opportunity.softDelete();
        opportunityRepository.save(opportunity);
        auditService.logDelete("Opportunity", id);
        log.info("Opportunity deleted: {} ({})", opportunity.getName(), id);
    }

    @Transactional(readOnly = true)
    public PortfolioDashboardResponse getDashboard(UUID organizationId) {
        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();
        if (organizationId != null && !organizationId.equals(currentOrgId)) {
            throw new AccessDeniedException("Cannot access dashboard for another organization");
        }

        long total = opportunityRepository.countTotal(currentOrgId);

        Map<String, Long> stageCounts = new HashMap<>();
        List<Object[]> stageData = opportunityRepository.countByStageAndOrganizationId(currentOrgId);
        for (Object[] row : stageData) {
            OpportunityStage stage = (OpportunityStage) row[0];
            Long count = (Long) row[1];
            stageCounts.put(stage.name(), count);
        }

        BigDecimal pipelineValue = opportunityRepository.sumPipelineValue(currentOrgId);
        long wonCount = opportunityRepository.countWon(currentOrgId);
        long closedCount = opportunityRepository.countClosed(currentOrgId);

        BigDecimal winRate = BigDecimal.ZERO;
        if (closedCount > 0) {
            winRate = BigDecimal.valueOf(wonCount)
                    .multiply(BigDecimal.valueOf(100))
                    .divide(BigDecimal.valueOf(closedCount), 2, RoundingMode.HALF_UP);
        }

        return new PortfolioDashboardResponse(
                total,
                stageCounts,
                pipelineValue != null ? pipelineValue : BigDecimal.ZERO,
                wonCount,
                closedCount,
                winRate
        );
    }

    // ======================== BidPackage ========================

    @Transactional(readOnly = true)
    public Page<BidPackageResponse> listBidPackages(UUID opportunityId, BidStatus status, Pageable pageable) {
        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();
        if (opportunityId != null) {
            // Tenant isolation: ensure opportunity belongs to current org before listing its bid packages.
            getOpportunityOrThrow(opportunityId);
            return bidPackageRepository.findByOpportunityIdAndDeletedFalse(opportunityId, pageable)
                    .map(BidPackageResponse::fromEntity);
        }
        return bidPackageRepository.findTenantBidPackages(currentOrgId, status, pageable)
                .map(BidPackageResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public BidPackageResponse getBidPackage(UUID id) {
        BidPackage bidPackage = getBidPackageOrThrow(id);
        return BidPackageResponse.fromEntity(bidPackage);
    }

    @Transactional
    public BidPackageResponse createBidPackage(CreateBidPackageRequest request) {
        // Tenant isolation: cannot create bid package for an opportunity in another org.
        getOpportunityOrThrow(request.opportunityId());

        BidPackage bidPackage = BidPackage.builder()
                .opportunityId(request.opportunityId())
                .projectName(request.projectName())
                .status(BidStatus.DRAFT)
                .bidNumber(request.bidNumber())
                .clientOrganization(request.clientOrganization())
                .submissionDeadline(request.submissionDeadline())
                .bidAmount(request.bidAmount())
                .estimatedCost(request.estimatedCost())
                .estimatedMargin(request.estimatedMargin())
                .bidManagerId(request.bidManagerId())
                .technicalLeadId(request.technicalLeadId())
                .bondRequired(request.bondRequired() != null ? request.bondRequired() : false)
                .bondAmount(request.bondAmount())
                .documents(request.documents())
                .competitorInfo(request.competitorInfo())
                .notes(request.notes())
                .build();

        bidPackage = bidPackageRepository.save(bidPackage);
        auditService.logCreate("BidPackage", bidPackage.getId());

        log.info("BidPackage created: {} ({})", bidPackage.getProjectName(), bidPackage.getId());
        return BidPackageResponse.fromEntity(bidPackage);
    }

    @Transactional
    public BidPackageResponse updateBidPackage(UUID id, UpdateBidPackageRequest request) {
        BidPackage bidPackage = getBidPackageOrThrow(id);

        if (request.projectName() != null) {
            bidPackage.setProjectName(request.projectName());
        }
        if (request.status() != null) {
            bidPackage.setStatus(request.status());
        }
        if (request.bidNumber() != null) {
            bidPackage.setBidNumber(request.bidNumber());
        }
        if (request.clientOrganization() != null) {
            bidPackage.setClientOrganization(request.clientOrganization());
        }
        if (request.submissionDeadline() != null) {
            bidPackage.setSubmissionDeadline(request.submissionDeadline());
        }
        if (request.submissionDate() != null) {
            bidPackage.setSubmissionDate(request.submissionDate());
        }
        if (request.bidAmount() != null) {
            bidPackage.setBidAmount(request.bidAmount());
        }
        if (request.estimatedCost() != null) {
            bidPackage.setEstimatedCost(request.estimatedCost());
        }
        if (request.estimatedMargin() != null) {
            bidPackage.setEstimatedMargin(request.estimatedMargin());
        }
        if (request.bidManagerId() != null) {
            bidPackage.setBidManagerId(request.bidManagerId());
        }
        if (request.technicalLeadId() != null) {
            bidPackage.setTechnicalLeadId(request.technicalLeadId());
        }
        if (request.bondRequired() != null) {
            bidPackage.setBondRequired(request.bondRequired());
        }
        if (request.bondAmount() != null) {
            bidPackage.setBondAmount(request.bondAmount());
        }
        if (request.documents() != null) {
            bidPackage.setDocuments(request.documents());
        }
        if (request.competitorInfo() != null) {
            bidPackage.setCompetitorInfo(request.competitorInfo());
        }
        if (request.notes() != null) {
            bidPackage.setNotes(request.notes());
        }

        bidPackage = bidPackageRepository.save(bidPackage);
        auditService.logUpdate("BidPackage", bidPackage.getId(), "multiple", null, null);

        log.info("BidPackage updated: {} ({})", bidPackage.getProjectName(), bidPackage.getId());
        return BidPackageResponse.fromEntity(bidPackage);
    }

    @Transactional
    public void deleteBidPackage(UUID id) {
        BidPackage bidPackage = getBidPackageOrThrow(id);
        bidPackage.softDelete();
        bidPackageRepository.save(bidPackage);
        auditService.logDelete("BidPackage", id);
        log.info("BidPackage deleted: {} ({})", bidPackage.getProjectName(), id);
    }

    // ======================== Prequalification ========================

    @Transactional(readOnly = true)
    public Page<PrequalificationResponse> listPrequalifications(UUID organizationId,
                                                                  PrequalificationStatus status,
                                                                  Pageable pageable) {
        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();
        if (organizationId != null && !organizationId.equals(currentOrgId)) {
            throw new AccessDeniedException("Cannot access prequalifications for another organization");
        }

        if (status != null) {
            return prequalificationRepository
                    .findByOrganizationIdAndStatusAndDeletedFalse(currentOrgId, status, pageable)
                    .map(PrequalificationResponse::fromEntity);
        }

        return prequalificationRepository
                .findByOrganizationIdAndDeletedFalse(currentOrgId, pageable)
                .map(PrequalificationResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public PrequalificationResponse getPrequalification(UUID id) {
        Prequalification pq = getPrequalificationOrThrow(id);
        return PrequalificationResponse.fromEntity(pq);
    }

    @Transactional
    public PrequalificationResponse createPrequalification(CreatePrequalificationRequest request) {
        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();
        if (request.organizationId() != null && !request.organizationId().equals(currentOrgId)) {
            throw new AccessDeniedException("Cannot create prequalification in another organization");
        }

        Prequalification pq = Prequalification.builder()
                .organizationId(currentOrgId)
                .clientName(request.clientName())
                .projectName(request.projectName())
                .status(PrequalificationStatus.DRAFT)
                .submissionDate(request.submissionDate())
                .expiryDate(request.expiryDate())
                .categories(request.categories())
                .maxContractValue(request.maxContractValue())
                .responsibleId(request.responsibleId())
                .documents(request.documents())
                .notes(request.notes())
                .build();

        pq = prequalificationRepository.save(pq);
        auditService.logCreate("Prequalification", pq.getId());

        log.info("Prequalification created: {} ({})", pq.getClientName(), pq.getId());
        return PrequalificationResponse.fromEntity(pq);
    }

    @Transactional
    public PrequalificationResponse updatePrequalification(UUID id, UpdatePrequalificationRequest request) {
        Prequalification pq = getPrequalificationOrThrow(id);

        if (request.clientName() != null) {
            pq.setClientName(request.clientName());
        }
        if (request.projectName() != null) {
            pq.setProjectName(request.projectName());
        }
        if (request.status() != null) {
            PrequalificationStatus oldStatus = pq.getStatus();
            pq.setStatus(request.status());
            auditService.logStatusChange("Prequalification", pq.getId(), oldStatus.name(), request.status().name());
        }
        if (request.submissionDate() != null) {
            pq.setSubmissionDate(request.submissionDate());
        }
        if (request.expiryDate() != null) {
            pq.setExpiryDate(request.expiryDate());
        }
        if (request.categories() != null) {
            pq.setCategories(request.categories());
        }
        if (request.maxContractValue() != null) {
            pq.setMaxContractValue(request.maxContractValue());
        }
        if (request.responsibleId() != null) {
            pq.setResponsibleId(request.responsibleId());
        }
        if (request.documents() != null) {
            pq.setDocuments(request.documents());
        }
        if (request.notes() != null) {
            pq.setNotes(request.notes());
        }

        pq = prequalificationRepository.save(pq);
        auditService.logUpdate("Prequalification", pq.getId(), "multiple", null, null);

        log.info("Prequalification updated: {} ({})", pq.getClientName(), pq.getId());
        return PrequalificationResponse.fromEntity(pq);
    }

    @Transactional
    public void deletePrequalification(UUID id) {
        Prequalification pq = getPrequalificationOrThrow(id);
        pq.softDelete();
        prequalificationRepository.save(pq);
        auditService.logDelete("Prequalification", id);
        log.info("Prequalification deleted: {} ({})", pq.getClientName(), id);
    }

    // ======================== TenderSubmission ========================

    @Transactional(readOnly = true)
    public Page<TenderSubmissionResponse> listTenderSubmissions(UUID bidPackageId, Pageable pageable) {
        if (bidPackageId == null) {
            throw new IllegalArgumentException("bidPackageId is required");
        }
        // Tenant isolation: ensure bid package (and its opportunity) belongs to current org.
        getBidPackageOrThrow(bidPackageId);
        return tenderSubmissionRepository.findByBidPackageIdAndDeletedFalse(bidPackageId, pageable)
                .map(TenderSubmissionResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public TenderSubmissionResponse getTenderSubmission(UUID id) {
        TenderSubmission ts = getTenderSubmissionOrThrow(id);
        return TenderSubmissionResponse.fromEntity(ts);
    }

    @Transactional
    public TenderSubmissionResponse createTenderSubmission(CreateTenderSubmissionRequest request) {
        getBidPackageOrThrow(request.bidPackageId());

        BigDecimal finalPrice = request.finalPrice();
        if (finalPrice == null && request.totalPrice() != null) {
            BigDecimal discount = request.discountPercent() != null ? request.discountPercent() : BigDecimal.ZERO;
            finalPrice = request.totalPrice().subtract(
                    request.totalPrice().multiply(discount).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)
            );
        }

        TenderSubmission ts = TenderSubmission.builder()
                .bidPackageId(request.bidPackageId())
                .technicalProposal(request.technicalProposal())
                .commercialSummary(request.commercialSummary())
                .totalPrice(request.totalPrice())
                .discountPercent(request.discountPercent())
                .finalPrice(finalPrice)
                .submittedById(request.submittedById())
                .submittedAt(Instant.now())
                .attachmentIds(request.attachmentIds())
                .build();

        ts = tenderSubmissionRepository.save(ts);
        auditService.logCreate("TenderSubmission", ts.getId());

        log.info("TenderSubmission created for BidPackage {} ({})", request.bidPackageId(), ts.getId());
        return TenderSubmissionResponse.fromEntity(ts);
    }

    @Transactional
    public void deleteTenderSubmission(UUID id) {
        TenderSubmission ts = getTenderSubmissionOrThrow(id);
        ts.softDelete();
        tenderSubmissionRepository.save(ts);
        auditService.logDelete("TenderSubmission", id);
        log.info("TenderSubmission deleted: {}", id);
    }

    // ======================== Private helpers ========================

    private Opportunity getOpportunityOrThrow(UUID id) {
        Opportunity opportunity = opportunityRepository.findById(id)
                .filter(o -> !o.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Возможность не найдена: " + id));

        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();
        if (opportunity.getOrganizationId() == null || !opportunity.getOrganizationId().equals(currentOrgId)) {
            // Avoid leaking cross-tenant existence.
            throw new EntityNotFoundException("Возможность не найдена: " + id);
        }

        return opportunity;
    }

    private BidPackage getBidPackageOrThrow(UUID id) {
        BidPackage bidPackage = bidPackageRepository.findById(id)
                .filter(bp -> !bp.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Тендерный пакет не найден: " + id));

        if (bidPackage.getOpportunityId() == null) {
            // A bid package without an opportunity cannot be tenant-scoped safely.
            throw new EntityNotFoundException("Тендерный пакет не найден: " + id);
        }
        // Reuse opportunity tenant check.
        getOpportunityOrThrow(bidPackage.getOpportunityId());

        return bidPackage;
    }

    private Prequalification getPrequalificationOrThrow(UUID id) {
        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();
        return prequalificationRepository.findByIdAndOrganizationIdAndDeletedFalse(id, currentOrgId)
                .orElseThrow(() -> new EntityNotFoundException("Преквалификация не найдена: " + id));
    }

    private TenderSubmission getTenderSubmissionOrThrow(UUID id) {
        TenderSubmission ts = tenderSubmissionRepository.findById(id)
                .filter(t -> !t.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Тендерная заявка не найдена: " + id));

        // Tenant isolation via bid package -> opportunity.
        getBidPackageOrThrow(ts.getBidPackageId());

        return ts;
    }
}
