package com.privod.platform.modules.bidManagement.service;

import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.bidManagement.domain.BidEvaluation;
import com.privod.platform.modules.bidManagement.domain.BidInvitation;
import com.privod.platform.modules.bidManagement.domain.BidInvitationStatus;
import com.privod.platform.modules.bidManagement.domain.BidPackage;
import com.privod.platform.modules.bidManagement.domain.BidPackageStatus;
import com.privod.platform.modules.bidManagement.repository.BidEvaluationRepository;
import com.privod.platform.modules.bidManagement.repository.BidInvitationRepository;
import com.privod.platform.modules.bidManagement.repository.BidPackageRepository;
import com.privod.platform.modules.bidManagement.web.dto.BidEvaluationResponse;
import com.privod.platform.modules.bidManagement.web.dto.BidInvitationResponse;
import com.privod.platform.modules.bidManagement.web.dto.BidPackageResponse;
import com.privod.platform.modules.bidManagement.web.dto.CreateBidEvaluationRequest;
import com.privod.platform.modules.bidManagement.web.dto.CreateBidInvitationRequest;
import com.privod.platform.modules.bidManagement.web.dto.CreateBidPackageRequest;
import com.privod.platform.modules.bidManagement.web.dto.LevelingMatrixResponse;
import com.privod.platform.modules.bidManagement.web.dto.UpdateBidInvitationRequest;
import com.privod.platform.modules.bidManagement.web.dto.UpdateBidPackageRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class BidManagementService {

    private final BidPackageRepository packageRepo;
    private final BidInvitationRepository invitationRepo;
    private final BidEvaluationRepository evaluationRepo;

    // ========== BID PACKAGES ==========

    @Transactional(readOnly = true)
    public List<BidPackageResponse> listPackages(UUID projectId) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        List<BidPackage> packages;
        if (projectId != null) {
            packages = packageRepo.findByProjectIdAndDeletedFalseOrderByCreatedAtDesc(projectId);
        } else {
            packages = packageRepo.findByOrganizationIdAndDeletedFalseOrderByCreatedAtDesc(orgId);
        }
        return packages.stream()
                .filter(p -> p.getOrganizationId().equals(orgId))
                .map(p -> BidPackageResponse.fromEntity(p, invitationRepo.countByBidPackageIdAndDeletedFalse(p.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public BidPackageResponse getPackage(UUID id) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        BidPackage pkg = packageRepo.findByIdAndOrganizationIdAndDeletedFalse(id, orgId)
                .orElseThrow(() -> new EntityNotFoundException("Тендерный пакет не найден: " + id));
        long invCount = invitationRepo.countByBidPackageIdAndDeletedFalse(id);
        return BidPackageResponse.fromEntity(pkg, invCount);
    }

    @Transactional
    public BidPackageResponse createPackage(CreateBidPackageRequest req) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        BidPackage pkg = BidPackage.builder()
                .organizationId(orgId)
                .projectId(req.projectId())
                .name(req.name())
                .description(req.description())
                .bidDueDate(req.bidDueDate())
                .scopeOfWork(req.scopeOfWork())
                .specSections(req.specSections())
                .status(BidPackageStatus.DRAFT)
                .build();
        pkg = packageRepo.save(pkg);
        log.info("Создан тендерный пакет: {} (проект {})", pkg.getName(), pkg.getProjectId());
        return BidPackageResponse.fromEntity(pkg);
    }

    @Transactional
    public BidPackageResponse updatePackage(UUID id, UpdateBidPackageRequest req) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        BidPackage pkg = packageRepo.findByIdAndOrganizationIdAndDeletedFalse(id, orgId)
                .orElseThrow(() -> new EntityNotFoundException("Тендерный пакет не найден: " + id));
        if (req.name() != null) pkg.setName(req.name());
        if (req.description() != null) pkg.setDescription(req.description());
        if (req.status() != null) pkg.setStatus(BidPackageStatus.valueOf(req.status()));
        if (req.bidDueDate() != null) pkg.setBidDueDate(req.bidDueDate());
        if (req.scopeOfWork() != null) pkg.setScopeOfWork(req.scopeOfWork());
        if (req.specSections() != null) pkg.setSpecSections(req.specSections());
        pkg = packageRepo.save(pkg);
        long invCount = invitationRepo.countByBidPackageIdAndDeletedFalse(id);
        log.info("Обновлён тендерный пакет: {}", pkg.getName());
        return BidPackageResponse.fromEntity(pkg, invCount);
    }

    @Transactional
    public void deletePackage(UUID id) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        BidPackage pkg = packageRepo.findByIdAndOrganizationIdAndDeletedFalse(id, orgId)
                .orElseThrow(() -> new EntityNotFoundException("Тендерный пакет не найден: " + id));
        pkg.softDelete();
        packageRepo.save(pkg);
        log.info("Удалён тендерный пакет: {}", pkg.getName());
    }

    // ========== BID INVITATIONS ==========

    @Transactional(readOnly = true)
    public List<BidInvitationResponse> listInvitations(UUID packageId) {
        ensurePackageAccessible(packageId);
        return invitationRepo.findByBidPackageIdAndDeletedFalseOrderByCreatedAtDesc(packageId)
                .stream()
                .map(BidInvitationResponse::fromEntity)
                .toList();
    }

    @Transactional
    public BidInvitationResponse createInvitation(UUID packageId, CreateBidInvitationRequest req) {
        ensurePackageAccessible(packageId);
        BidInvitation inv = BidInvitation.builder()
                .bidPackageId(packageId)
                .vendorId(req.vendorId())
                .vendorName(req.vendorName())
                .vendorEmail(req.vendorEmail())
                .bidAmount(req.bidAmount())
                .bidNotes(req.bidNotes())
                .status(BidInvitationStatus.INVITED)
                .invitedAt(LocalDateTime.now())
                .build();
        inv = invitationRepo.save(inv);
        log.info("Приглашение создано: {} для пакета {}", inv.getVendorName(), packageId);
        return BidInvitationResponse.fromEntity(inv);
    }

    @Transactional
    public BidInvitationResponse updateInvitation(UUID packageId, UUID invId, UpdateBidInvitationRequest req) {
        ensurePackageAccessible(packageId);
        BidInvitation inv = invitationRepo.findByIdAndDeletedFalse(invId)
                .orElseThrow(() -> new EntityNotFoundException("Приглашение не найдено: " + invId));
        if (req.vendorName() != null) inv.setVendorName(req.vendorName());
        if (req.vendorEmail() != null) inv.setVendorEmail(req.vendorEmail());
        if (req.vendorId() != null) inv.setVendorId(req.vendorId());
        if (req.status() != null) {
            inv.setStatus(BidInvitationStatus.valueOf(req.status()));
            if (req.status().equals("SUBMITTED")) {
                inv.setRespondedAt(LocalDateTime.now());
            }
        }
        if (req.bidAmount() != null) inv.setBidAmount(req.bidAmount());
        if (req.bidNotes() != null) inv.setBidNotes(req.bidNotes());
        if (req.attachmentsCount() != null) inv.setAttachmentsCount(req.attachmentsCount());
        inv = invitationRepo.save(inv);
        log.info("Приглашение обновлено: {} (статус {})", inv.getVendorName(), inv.getStatus());
        return BidInvitationResponse.fromEntity(inv);
    }

    @Transactional
    public void deleteInvitation(UUID packageId, UUID invId) {
        ensurePackageAccessible(packageId);
        BidInvitation inv = invitationRepo.findByIdAndDeletedFalse(invId)
                .orElseThrow(() -> new EntityNotFoundException("Приглашение не найдено: " + invId));
        inv.softDelete();
        invitationRepo.save(inv);
        log.info("Приглашение удалено: {}", inv.getVendorName());
    }

    // ========== BID EVALUATIONS ==========

    @Transactional(readOnly = true)
    public List<BidEvaluationResponse> listEvaluations(UUID packageId) {
        ensurePackageAccessible(packageId);
        return evaluationRepo.findByBidPackageIdAndDeletedFalse(packageId)
                .stream()
                .map(BidEvaluationResponse::fromEntity)
                .toList();
    }

    @Transactional
    public BidEvaluationResponse createEvaluation(UUID packageId, CreateBidEvaluationRequest req) {
        ensurePackageAccessible(packageId);
        BidEvaluation eval = BidEvaluation.builder()
                .bidPackageId(packageId)
                .invitationId(req.invitationId())
                .criteriaName(req.criteriaName())
                .score(req.score())
                .maxScore(req.maxScore() != null ? req.maxScore() : 10)
                .weight(req.weight() != null ? req.weight() : BigDecimal.ONE)
                .notes(req.notes())
                .evaluatorName(req.evaluatorName())
                .build();
        eval = evaluationRepo.save(eval);
        log.info("Оценка создана: {} для приглашения {}", eval.getCriteriaName(), eval.getInvitationId());
        return BidEvaluationResponse.fromEntity(eval);
    }

    // ========== LEVELING MATRIX ==========

    @Transactional(readOnly = true)
    public LevelingMatrixResponse getLevelingMatrix(UUID packageId) {
        ensurePackageAccessible(packageId);

        List<BidInvitation> invitations = invitationRepo.findByBidPackageIdAndDeletedFalseOrderByCreatedAtDesc(packageId);
        List<BidEvaluation> evaluations = evaluationRepo.findByBidPackageIdAndDeletedFalse(packageId);

        // Collect unique criteria names preserving order
        Set<String> criteriaSet = new LinkedHashSet<>();
        for (BidEvaluation e : evaluations) {
            criteriaSet.add(e.getCriteriaName());
        }
        List<String> criteria = new ArrayList<>(criteriaSet);

        // Build scores map: invitationId -> criteriaName -> ScoreCell
        Map<String, Map<String, LevelingMatrixResponse.ScoreCell>> scores = new LinkedHashMap<>();
        for (BidInvitation inv : invitations) {
            scores.put(inv.getId().toString(), new HashMap<>());
        }
        for (BidEvaluation e : evaluations) {
            String invId = e.getInvitationId().toString();
            Map<String, LevelingMatrixResponse.ScoreCell> invScores = scores.get(invId);
            if (invScores != null) {
                invScores.put(e.getCriteriaName(), new LevelingMatrixResponse.ScoreCell(e.getScore(), e.getMaxScore(), e.getWeight()));
            }
        }

        // Calculate weighted totals per invitation
        Map<String, BigDecimal> totals = new LinkedHashMap<>();
        for (BidInvitation inv : invitations) {
            String invId = inv.getId().toString();
            Map<String, LevelingMatrixResponse.ScoreCell> invScores = scores.get(invId);
            BigDecimal total = BigDecimal.ZERO;
            BigDecimal totalWeight = BigDecimal.ZERO;
            if (invScores != null) {
                for (LevelingMatrixResponse.ScoreCell cell : invScores.values()) {
                    if (cell.score() != null && cell.maxScore() != null && cell.maxScore() > 0) {
                        BigDecimal normalized = new BigDecimal(cell.score())
                                .divide(new BigDecimal(cell.maxScore()), 4, RoundingMode.HALF_UP);
                        total = total.add(normalized.multiply(cell.weight()));
                        totalWeight = totalWeight.add(cell.weight());
                    }
                }
            }
            if (totalWeight.compareTo(BigDecimal.ZERO) > 0) {
                totals.put(invId, total.divide(totalWeight, 4, RoundingMode.HALF_UP).multiply(new BigDecimal(100)).setScale(2, RoundingMode.HALF_UP));
            } else {
                totals.put(invId, BigDecimal.ZERO);
            }
        }

        List<BidInvitationResponse> invResponses = invitations.stream()
                .map(BidInvitationResponse::fromEntity)
                .toList();

        return new LevelingMatrixResponse(invResponses, criteria, scores, totals);
    }

    // ========== HELPERS ==========

    private void ensurePackageAccessible(UUID packageId) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        packageRepo.findByIdAndOrganizationIdAndDeletedFalse(packageId, orgId)
                .orElseThrow(() -> new EntityNotFoundException("Тендерный пакет не найден: " + packageId));
    }
}
