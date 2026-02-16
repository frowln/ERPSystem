package com.privod.platform.modules.bidScoring.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.bidScoring.domain.BidComparison;
import com.privod.platform.modules.bidScoring.domain.BidCriteria;
import com.privod.platform.modules.bidScoring.domain.BidScore;
import com.privod.platform.modules.bidScoring.domain.ComparisonStatus;
import com.privod.platform.modules.bidScoring.repository.BidComparisonRepository;
import com.privod.platform.modules.bidScoring.repository.BidCriteriaRepository;
import com.privod.platform.modules.bidScoring.repository.BidScoreRepository;
import com.privod.platform.modules.bidScoring.web.dto.BidComparisonResponse;
import com.privod.platform.modules.bidScoring.web.dto.BidCriteriaResponse;
import com.privod.platform.modules.bidScoring.web.dto.BidScoreResponse;
import com.privod.platform.modules.bidScoring.web.dto.CreateBidComparisonRequest;
import com.privod.platform.modules.bidScoring.web.dto.CreateBidCriteriaRequest;
import com.privod.platform.modules.bidScoring.web.dto.CreateBidScoreRequest;
import com.privod.platform.modules.bidScoring.web.dto.UpdateBidComparisonRequest;
import com.privod.platform.modules.bidScoring.web.dto.VendorTotalScoreResponse;
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
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class BidScoringService {

    private final BidComparisonRepository bidComparisonRepository;
    private final BidCriteriaRepository bidCriteriaRepository;
    private final BidScoreRepository bidScoreRepository;
    private final AuditService auditService;

    // ======================== BidComparison ========================

    @Transactional(readOnly = true)
    public Page<BidComparisonResponse> listComparisons(UUID projectId, ComparisonStatus status,
                                                        Pageable pageable) {
        if (projectId != null) {
            return bidComparisonRepository.findByProjectIdAndDeletedFalse(projectId, pageable)
                    .map(BidComparisonResponse::fromEntity);
        }
        if (status != null) {
            return bidComparisonRepository.findByStatusAndDeletedFalse(status, pageable)
                    .map(BidComparisonResponse::fromEntity);
        }
        return bidComparisonRepository.findByDeletedFalse(pageable)
                .map(BidComparisonResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public BidComparisonResponse getComparison(UUID id) {
        BidComparison comparison = getComparisonOrThrow(id);
        return BidComparisonResponse.fromEntity(comparison);
    }

    @Transactional
    public BidComparisonResponse createComparison(CreateBidComparisonRequest request) {
        BidComparison comparison = BidComparison.builder()
                .projectId(request.projectId())
                .title(request.title())
                .description(request.description())
                .status(ComparisonStatus.DRAFT)
                .rfqNumber(request.rfqNumber())
                .category(request.category())
                .createdById(request.createdById())
                .build();

        comparison = bidComparisonRepository.save(comparison);
        auditService.logCreate("BidComparison", comparison.getId());

        log.info("BidComparison created: {} ({})", comparison.getTitle(), comparison.getId());
        return BidComparisonResponse.fromEntity(comparison);
    }

    @Transactional
    public BidComparisonResponse updateComparison(UUID id, UpdateBidComparisonRequest request) {
        BidComparison comparison = getComparisonOrThrow(id);

        if (request.title() != null) {
            comparison.setTitle(request.title());
        }
        if (request.description() != null) {
            comparison.setDescription(request.description());
        }
        if (request.rfqNumber() != null) {
            comparison.setRfqNumber(request.rfqNumber());
        }
        if (request.category() != null) {
            comparison.setCategory(request.category());
        }
        if (request.winnerVendorId() != null) {
            comparison.setWinnerVendorId(request.winnerVendorId());
        }
        if (request.winnerJustification() != null) {
            comparison.setWinnerJustification(request.winnerJustification());
        }

        comparison = bidComparisonRepository.save(comparison);
        auditService.logUpdate("BidComparison", comparison.getId(), "multiple", null, null);

        log.info("BidComparison updated: {} ({})", comparison.getTitle(), comparison.getId());
        return BidComparisonResponse.fromEntity(comparison);
    }

    @Transactional
    public BidComparisonResponse completeComparison(UUID id) {
        BidComparison comparison = getComparisonOrThrow(id);

        if (comparison.getStatus() != ComparisonStatus.IN_PROGRESS) {
            throw new IllegalStateException(
                    "Завершить можно только сравнение в статусе 'В процессе'");
        }

        // Validate criteria weights sum to 100
        validateCriteriaWeights(id);

        ComparisonStatus oldStatus = comparison.getStatus();
        comparison.setStatus(ComparisonStatus.COMPLETED);

        // Auto-determine winner
        List<Object[]> vendorScores = bidScoreRepository.getVendorTotalScores(id);
        if (!vendorScores.isEmpty()) {
            Object[] winner = vendorScores.get(0);
            comparison.setWinnerVendorId((UUID) winner[0]);
            comparison.setWinnerJustification("Автоматически определён по наивысшему взвешенному баллу");
        }

        comparison = bidComparisonRepository.save(comparison);
        auditService.logStatusChange("BidComparison", comparison.getId(),
                oldStatus.name(), ComparisonStatus.COMPLETED.name());

        log.info("BidComparison completed: {} ({})", comparison.getTitle(), comparison.getId());
        return BidComparisonResponse.fromEntity(comparison);
    }

    @Transactional
    public BidComparisonResponse approveComparison(UUID id, UUID approvedById) {
        BidComparison comparison = getComparisonOrThrow(id);

        if (comparison.getStatus() != ComparisonStatus.COMPLETED) {
            throw new IllegalStateException(
                    "Утвердить можно только завершённое сравнение");
        }

        ComparisonStatus oldStatus = comparison.getStatus();
        comparison.setStatus(ComparisonStatus.APPROVED);
        comparison.setApprovedById(approvedById);
        comparison.setApprovedAt(Instant.now());

        comparison = bidComparisonRepository.save(comparison);
        auditService.logStatusChange("BidComparison", comparison.getId(),
                oldStatus.name(), ComparisonStatus.APPROVED.name());

        log.info("BidComparison approved: {} ({})", comparison.getTitle(), comparison.getId());
        return BidComparisonResponse.fromEntity(comparison);
    }

    @Transactional
    public BidComparisonResponse startComparison(UUID id) {
        BidComparison comparison = getComparisonOrThrow(id);

        if (comparison.getStatus() != ComparisonStatus.DRAFT) {
            throw new IllegalStateException(
                    "Начать можно только сравнение в статусе 'Черновик'");
        }

        ComparisonStatus oldStatus = comparison.getStatus();
        comparison.setStatus(ComparisonStatus.IN_PROGRESS);

        comparison = bidComparisonRepository.save(comparison);
        auditService.logStatusChange("BidComparison", comparison.getId(),
                oldStatus.name(), ComparisonStatus.IN_PROGRESS.name());

        log.info("BidComparison started: {} ({})", comparison.getTitle(), comparison.getId());
        return BidComparisonResponse.fromEntity(comparison);
    }

    @Transactional
    public void deleteComparison(UUID id) {
        BidComparison comparison = getComparisonOrThrow(id);
        comparison.softDelete();
        bidComparisonRepository.save(comparison);
        auditService.logDelete("BidComparison", id);
        log.info("BidComparison deleted: {} ({})", comparison.getTitle(), id);
    }

    // ======================== BidCriteria ========================

    @Transactional(readOnly = true)
    public List<BidCriteriaResponse> listCriteria(UUID bidComparisonId) {
        return bidCriteriaRepository.findByBidComparisonIdAndDeletedFalseOrderBySortOrderAsc(bidComparisonId)
                .stream()
                .map(BidCriteriaResponse::fromEntity)
                .toList();
    }

    @Transactional
    public BidCriteriaResponse createCriteria(CreateBidCriteriaRequest request) {
        getComparisonOrThrow(request.bidComparisonId());

        // Validate that adding this criteria won't exceed 100% weight
        BigDecimal currentWeight = bidCriteriaRepository.sumWeightByBidComparisonId(request.bidComparisonId());
        BigDecimal newTotalWeight = currentWeight.add(request.weight());
        if (newTotalWeight.compareTo(BigDecimal.valueOf(100)) > 0) {
            throw new IllegalArgumentException(
                    String.format("Сумма весов критериев превышает 100%%. Текущая сумма: %s%%, добавляемый вес: %s%%",
                            currentWeight, request.weight()));
        }

        BidCriteria criteria = BidCriteria.builder()
                .bidComparisonId(request.bidComparisonId())
                .criteriaType(request.criteriaType())
                .name(request.name())
                .description(request.description())
                .weight(request.weight())
                .maxScore(request.maxScore() != null ? request.maxScore() : 10)
                .sortOrder(request.sortOrder())
                .build();

        criteria = bidCriteriaRepository.save(criteria);
        auditService.logCreate("BidCriteria", criteria.getId());

        log.info("BidCriteria created: {} for comparison {} ({})",
                criteria.getName(), request.bidComparisonId(), criteria.getId());
        return BidCriteriaResponse.fromEntity(criteria);
    }

    @Transactional
    public void deleteCriteria(UUID id) {
        BidCriteria criteria = bidCriteriaRepository.findById(id)
                .filter(c -> !c.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Критерий не найден: " + id));
        criteria.softDelete();
        bidCriteriaRepository.save(criteria);
        auditService.logDelete("BidCriteria", id);
        log.info("BidCriteria deleted: {} ({})", criteria.getName(), id);
    }

    // ======================== BidScore ========================

    @Transactional(readOnly = true)
    public List<BidScoreResponse> listScores(UUID bidComparisonId) {
        return bidScoreRepository.findByBidComparisonIdAndDeletedFalse(bidComparisonId)
                .stream()
                .map(BidScoreResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<BidScoreResponse> getVendorScores(UUID bidComparisonId, UUID vendorId) {
        return bidScoreRepository.findByBidComparisonIdAndVendorIdAndDeletedFalse(bidComparisonId, vendorId)
                .stream()
                .map(BidScoreResponse::fromEntity)
                .toList();
    }

    @Transactional
    public BidScoreResponse createScore(CreateBidScoreRequest request) {
        getComparisonOrThrow(request.bidComparisonId());

        BidCriteria criteria = bidCriteriaRepository.findById(request.criteriaId())
                .filter(c -> !c.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Критерий не найден: " + request.criteriaId()));

        if (!criteria.getBidComparisonId().equals(request.bidComparisonId())) {
            throw new IllegalArgumentException("Критерий не принадлежит данному сравнению");
        }

        // Validate score doesn't exceed maxScore
        if (request.score().compareTo(BigDecimal.valueOf(criteria.getMaxScore())) > 0) {
            throw new IllegalArgumentException(
                    String.format("Оценка (%s) превышает максимально допустимую (%d)",
                            request.score(), criteria.getMaxScore()));
        }

        // Calculate weighted score: score * weight / maxScore
        BigDecimal weightedScore = request.score()
                .multiply(criteria.getWeight())
                .divide(BigDecimal.valueOf(criteria.getMaxScore()), 4, RoundingMode.HALF_UP);

        BidScore score = BidScore.builder()
                .bidComparisonId(request.bidComparisonId())
                .criteriaId(request.criteriaId())
                .vendorId(request.vendorId())
                .vendorName(request.vendorName())
                .score(request.score())
                .weightedScore(weightedScore)
                .comments(request.comments())
                .scoredById(request.scoredById())
                .scoredAt(Instant.now())
                .build();

        score = bidScoreRepository.save(score);
        auditService.logCreate("BidScore", score.getId());

        log.info("BidScore created: vendor {} criteria {} score {} ({})",
                request.vendorId(), request.criteriaId(), request.score(), score.getId());
        return BidScoreResponse.fromEntity(score);
    }

    @Transactional
    public void deleteScore(UUID id) {
        BidScore score = bidScoreRepository.findById(id)
                .filter(s -> !s.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Оценка не найдена: " + id));
        score.softDelete();
        bidScoreRepository.save(score);
        auditService.logDelete("BidScore", id);
        log.info("BidScore deleted: {}", id);
    }

    @Transactional(readOnly = true)
    public List<VendorTotalScoreResponse> getVendorRanking(UUID bidComparisonId) {
        getComparisonOrThrow(bidComparisonId);

        List<Object[]> results = bidScoreRepository.getVendorTotalScores(bidComparisonId);
        return results.stream()
                .map(row -> new VendorTotalScoreResponse(
                        (UUID) row[0],
                        (String) row[1],
                        (BigDecimal) row[2]
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public VendorTotalScoreResponse determineWinner(UUID bidComparisonId) {
        getComparisonOrThrow(bidComparisonId);

        List<Object[]> results = bidScoreRepository.getVendorTotalScores(bidComparisonId);
        if (results.isEmpty()) {
            throw new IllegalStateException("Нет оценок для определения победителя");
        }

        Object[] winner = results.get(0);
        return new VendorTotalScoreResponse(
                (UUID) winner[0],
                (String) winner[1],
                (BigDecimal) winner[2]
        );
    }

    // ======================== Private helpers ========================

    private BidComparison getComparisonOrThrow(UUID id) {
        return bidComparisonRepository.findById(id)
                .filter(bc -> !bc.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Сравнение не найдено: " + id));
    }

    private void validateCriteriaWeights(UUID bidComparisonId) {
        BigDecimal totalWeight = bidCriteriaRepository.sumWeightByBidComparisonId(bidComparisonId);
        if (totalWeight.compareTo(BigDecimal.valueOf(100)) != 0) {
            throw new IllegalStateException(
                    String.format("Сумма весов критериев должна равняться 100%%. Текущая сумма: %s%%", totalWeight));
        }
    }
}
