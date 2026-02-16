package com.privod.platform.modules.bidScoring.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.bidScoring.domain.BidComparison;
import com.privod.platform.modules.bidScoring.domain.BidCriteria;
import com.privod.platform.modules.bidScoring.domain.BidScore;
import com.privod.platform.modules.bidScoring.domain.ComparisonStatus;
import com.privod.platform.modules.bidScoring.repository.BidComparisonRepository;
import com.privod.platform.modules.bidScoring.repository.BidCriteriaRepository;
import com.privod.platform.modules.bidScoring.repository.BidScoreRepository;
import com.privod.platform.modules.project.repository.ProjectRepository;
import com.privod.platform.modules.bidScoring.web.dto.BidComparisonResponse;
import com.privod.platform.modules.bidScoring.web.dto.BidCriteriaResponse;
import com.privod.platform.modules.bidScoring.web.dto.BidScoreResponse;
import com.privod.platform.modules.bidScoring.web.dto.CreateBidComparisonRequest;
import com.privod.platform.modules.bidScoring.web.dto.CreateBidCriteriaRequest;
import com.privod.platform.modules.bidScoring.web.dto.CreateBidScoreRequest;
import com.privod.platform.modules.bidScoring.web.dto.UpdateBidComparisonRequest;
import com.privod.platform.modules.bidScoring.web.dto.UpdateBidCriteriaRequest;
import com.privod.platform.modules.bidScoring.web.dto.UpdateBidScoreRequest;
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
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BidScoringService {

    private final BidComparisonRepository bidComparisonRepository;
    private final BidCriteriaRepository bidCriteriaRepository;
    private final BidScoreRepository bidScoreRepository;
    private final ProjectRepository projectRepository;
    private final AuditService auditService;

    // ======================== BidComparison ========================

    @Transactional(readOnly = true)
    public Page<BidComparisonResponse> listComparisons(UUID projectId, ComparisonStatus status,
                                                        Pageable pageable) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        if (projectId != null) {
            return bidComparisonRepository.findByOrganizationIdAndProjectIdAndDeletedFalse(
                            organizationId, projectId, pageable)
                    .map(BidComparisonResponse::fromEntity);
        }
        if (status != null) {
            return bidComparisonRepository.findByOrganizationIdAndStatusAndDeletedFalse(
                            organizationId, status, pageable)
                    .map(BidComparisonResponse::fromEntity);
        }
        return bidComparisonRepository.findByOrganizationIdAndDeletedFalse(organizationId, pageable)
                .map(BidComparisonResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public BidComparisonResponse getComparison(UUID id) {
        BidComparison comparison = getComparisonOrThrow(id);
        return BidComparisonResponse.fromEntity(comparison);
    }

    @Transactional
    public BidComparisonResponse createComparison(CreateBidComparisonRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        projectRepository.findByIdAndOrganizationIdAndDeletedFalse(request.projectId(), organizationId)
                .orElseThrow(() -> new EntityNotFoundException("Проект не найден в текущей организации: " + request.projectId()));

        UUID createdById = SecurityUtils.getCurrentUserId().orElse(request.createdById());

        BidComparison comparison = BidComparison.builder()
                .organizationId(organizationId)
                .projectId(request.projectId())
                .title(request.title())
                .description(request.description())
                .status(ComparisonStatus.DRAFT)
                .rfqNumber(request.rfqNumber())
                .category(request.category())
                .createdById(createdById)
                .build();

        comparison = bidComparisonRepository.save(comparison);
        auditService.logCreate("BidComparison", comparison.getId());

        log.info("BidComparison created: {} ({})", comparison.getTitle(), comparison.getId());
        return BidComparisonResponse.fromEntity(comparison);
    }

    @Transactional
    public BidComparisonResponse updateComparison(UUID id, UpdateBidComparisonRequest request) {
        BidComparison comparison = getComparisonOrThrow(id);

        if (comparison.getStatus() == ComparisonStatus.APPROVED) {
            throw new IllegalStateException("Утверждённое сравнение нельзя изменять");
        }

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
            if (!bidScoreRepository.existsByBidComparisonIdAndVendorIdAndDeletedFalse(
                    comparison.getId(), request.winnerVendorId())) {
                throw new IllegalArgumentException("Выбранный победитель отсутствует в оценочных листах сравнения");
            }
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

        // Auto-determine winner from fully-scored vendors only
        List<VendorTotalScoreResponse> ranking = computeEligibleVendorRanking(id);
        if (ranking.isEmpty()) {
            throw new IllegalStateException("Нельзя завершить сравнение: нет ни одного участника с оценками по всем критериям");
        }
        comparison.setWinnerVendorId(ranking.get(0).vendorId());
        comparison.setWinnerJustification("Автоматически определён по наивысшему взвешенному баллу");

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
        if (comparison.getWinnerVendorId() == null) {
            throw new IllegalStateException("Нельзя утвердить сравнение без выбранного победителя");
        }

        ComparisonStatus oldStatus = comparison.getStatus();
        UUID currentUserId = SecurityUtils.requireCurrentUserId();
        if (approvedById != null && !approvedById.equals(currentUserId)) {
            log.warn("Ignoring approvedById {} for BidComparison {}. Using current user {} from security context.",
                    approvedById, id, currentUserId);
        }
        comparison.setStatus(ComparisonStatus.APPROVED);
        comparison.setApprovedById(currentUserId);
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
        getComparisonOrThrow(bidComparisonId);
        return bidCriteriaRepository.findByBidComparisonIdAndDeletedFalseOrderBySortOrderAsc(bidComparisonId)
                .stream()
                .map(BidCriteriaResponse::fromEntity)
                .toList();
    }

    @Transactional
    public BidCriteriaResponse createCriteria(CreateBidCriteriaRequest request) {
        BidComparison comparison = getComparisonOrThrow(request.bidComparisonId());
        ensureComparisonEditableForScoring(comparison);

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
    public BidCriteriaResponse updateCriteria(UUID id, UpdateBidCriteriaRequest request) {
        BidCriteria criteria = bidCriteriaRepository.findById(id)
                .filter(c -> !c.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Критерий не найден: " + id));
        BidComparison comparison = getComparisonOrThrow(criteria.getBidComparisonId());
        ensureComparisonEditableForScoring(comparison);

        boolean needsRecalculateScores = false;
        BigDecimal currentWeight = criteria.getWeight() != null ? criteria.getWeight() : BigDecimal.ZERO;
        Integer currentMaxScore = criteria.getMaxScore() != null ? criteria.getMaxScore() : 10;

        if (request.weight() != null) {
            BigDecimal totalWeight = bidCriteriaRepository.sumWeightByBidComparisonId(criteria.getBidComparisonId());
            BigDecimal newTotalWeight = totalWeight.subtract(currentWeight).add(request.weight());
            if (newTotalWeight.compareTo(BigDecimal.valueOf(100)) > 0) {
                throw new IllegalArgumentException(
                        String.format("Сумма весов критериев превышает 100%%. Текущая сумма: %s%%, новый вес: %s%%",
                                totalWeight, request.weight()));
            }
            criteria.setWeight(request.weight());
            needsRecalculateScores = true;
        }

        if (request.maxScore() != null) {
            validateMaxScoreForExistingScores(criteria.getId(), request.maxScore());
            criteria.setMaxScore(request.maxScore());
            needsRecalculateScores = true;
        }

        if (request.criteriaType() != null) {
            criteria.setCriteriaType(request.criteriaType());
        }
        if (request.name() != null) {
            criteria.setName(request.name());
        }
        if (request.description() != null) {
            criteria.setDescription(request.description());
        }
        if (request.sortOrder() != null) {
            criteria.setSortOrder(request.sortOrder());
        }

        criteria = bidCriteriaRepository.save(criteria);

        if (needsRecalculateScores) {
            recalculateScoresForCriteria(criteria);
        }

        auditService.logUpdate("BidCriteria", criteria.getId(), "multiple", null, null);

        log.info("BidCriteria updated: {} ({}) weight {} -> {}, maxScore {} -> {}",
                criteria.getName(), criteria.getId(), currentWeight, criteria.getWeight(), currentMaxScore, criteria.getMaxScore());
        return BidCriteriaResponse.fromEntity(criteria);
    }

    @Transactional
    public void deleteCriteria(UUID id) {
        BidCriteria criteria = bidCriteriaRepository.findById(id)
                .filter(c -> !c.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Критерий не найден: " + id));
        BidComparison comparison = getComparisonOrThrow(criteria.getBidComparisonId());
        ensureComparisonEditableForScoring(comparison);
        criteria.softDelete();
        bidCriteriaRepository.save(criteria);
        auditService.logDelete("BidCriteria", id);
        log.info("BidCriteria deleted: {} ({})", criteria.getName(), id);
    }

    // ======================== BidScore ========================

    @Transactional(readOnly = true)
    public List<BidScoreResponse> listScores(UUID bidComparisonId) {
        getComparisonOrThrow(bidComparisonId);
        return bidScoreRepository.findByBidComparisonIdAndDeletedFalse(bidComparisonId)
                .stream()
                .map(BidScoreResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<BidScoreResponse> getVendorScores(UUID bidComparisonId, UUID vendorId) {
        getComparisonOrThrow(bidComparisonId);
        return bidScoreRepository.findByBidComparisonIdAndVendorIdAndDeletedFalse(bidComparisonId, vendorId)
                .stream()
                .map(BidScoreResponse::fromEntity)
                .toList();
    }

    @Transactional
    public BidScoreResponse createScore(CreateBidScoreRequest request) {
        BidComparison comparison = getComparisonOrThrow(request.bidComparisonId());
        ensureComparisonEditableForScoring(comparison);

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

        return bidScoreRepository.findByBidComparisonIdAndCriteriaIdAndVendorIdAndDeletedFalse(
                        request.bidComparisonId(), request.criteriaId(), request.vendorId())
                .map(existing -> updateExistingScore(existing, request, criteria))
                .orElseGet(() -> createNewScore(request, criteria));
    }

    @Transactional
    public BidScoreResponse updateScore(UUID id, UpdateBidScoreRequest request) {
        BidScore score = bidScoreRepository.findById(id)
                .filter(s -> !s.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Оценка не найдена: " + id));
        BidComparison comparison = getComparisonOrThrow(score.getBidComparisonId());
        ensureComparisonEditableForScoring(comparison);

        UUID criteriaId = score.getCriteriaId();
        BidCriteria criteria = bidCriteriaRepository.findById(criteriaId)
                .filter(c -> !c.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Критерий не найден: " + criteriaId));

        if (request.score().compareTo(BigDecimal.valueOf(criteria.getMaxScore())) > 0) {
            throw new IllegalArgumentException(
                    String.format("Оценка (%s) превышает максимально допустимую (%d)",
                            request.score(), criteria.getMaxScore()));
        }

        if (!criteria.getBidComparisonId().equals(score.getBidComparisonId())) {
            throw new IllegalStateException("Критерий оценки не принадлежит сравнению оценки");
        }

        BigDecimal oldScore = score.getScore();
        score.setScore(request.score());
        score.setWeightedScore(calculateWeightedScore(request.score(), criteria.getWeight(), criteria.getMaxScore()));
        score.setScoredAt(Instant.now());

        if (request.comments() != null) {
            score.setComments(request.comments());
        }
        if (request.vendorName() != null) {
            score.setVendorName(request.vendorName());
        }
        if (request.scoredById() != null) {
            score.setScoredById(request.scoredById());
        }

        score = bidScoreRepository.save(score);
        auditService.logUpdate(
                "BidScore",
                score.getId(),
                "score",
                oldScore != null ? oldScore.toPlainString() : null,
                score.getScore() != null ? score.getScore().toPlainString() : null
        );

        log.info("BidScore updated: {} score {} -> {} ({})",
                score.getVendorId(), oldScore, score.getScore(), score.getId());
        return BidScoreResponse.fromEntity(score);
    }

    @Transactional
    public void deleteScore(UUID id) {
        BidScore score = bidScoreRepository.findById(id)
                .filter(s -> !s.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Оценка не найдена: " + id));
        BidComparison comparison = getComparisonOrThrow(score.getBidComparisonId());
        ensureComparisonEditableForScoring(comparison);
        score.softDelete();
        bidScoreRepository.save(score);
        auditService.logDelete("BidScore", id);
        log.info("BidScore deleted: {}", id);
    }

    @Transactional(readOnly = true)
    public List<VendorTotalScoreResponse> getVendorRanking(UUID bidComparisonId) {
        getComparisonOrThrow(bidComparisonId);
        return computeEligibleVendorRanking(bidComparisonId);
    }

    @Transactional(readOnly = true)
    public VendorTotalScoreResponse determineWinner(UUID bidComparisonId) {
        getComparisonOrThrow(bidComparisonId);
        List<VendorTotalScoreResponse> ranking = computeEligibleVendorRanking(bidComparisonId);
        if (ranking.isEmpty()) {
            throw new IllegalStateException("Нет участников с полным набором оценок для определения победителя");
        }
        return ranking.get(0);
    }

    // ======================== Private helpers ========================

    private BidComparison getComparisonOrThrow(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        return bidComparisonRepository.findByIdAndOrganizationIdAndDeletedFalse(id, organizationId)
                .orElseThrow(() -> new EntityNotFoundException("Сравнение не найдено: " + id));
    }

    private void ensureComparisonEditableForScoring(BidComparison comparison) {
        if (comparison.getStatus() == ComparisonStatus.COMPLETED || comparison.getStatus() == ComparisonStatus.APPROVED) {
            throw new IllegalStateException("Изменение критериев и оценок недоступно после завершения/утверждения сравнения");
        }
    }

    private void recalculateScoresForCriteria(BidCriteria criteria) {
        List<BidScore> scores = bidScoreRepository.findByCriteriaIdAndDeletedFalse(criteria.getId());
        if (scores.isEmpty()) {
            return;
        }

        for (BidScore score : scores) {
            score.setWeightedScore(calculateWeightedScore(score.getScore(), criteria.getWeight(), criteria.getMaxScore()));
        }
        bidScoreRepository.saveAll(scores);
    }

    private void validateMaxScoreForExistingScores(UUID criteriaId, Integer maxScore) {
        List<BidScore> scores = bidScoreRepository.findByCriteriaIdAndDeletedFalse(criteriaId);
        boolean hasInvalid = scores.stream()
                .anyMatch(score -> score.getScore() != null
                        && score.getScore().compareTo(BigDecimal.valueOf(maxScore)) > 0);
        if (hasInvalid) {
            throw new IllegalArgumentException(
                    String.format("Нельзя уменьшить максимальный балл до %d: существуют оценки выше этого значения",
                            maxScore));
        }
    }

    private BigDecimal calculateWeightedScore(BigDecimal score, BigDecimal weight, Integer maxScore) {
        BigDecimal safeWeight = weight != null ? weight : BigDecimal.ZERO;
        int safeMaxScore = (maxScore != null && maxScore > 0) ? maxScore : 10;
        return score
                .multiply(safeWeight)
                .divide(BigDecimal.valueOf(safeMaxScore), 4, RoundingMode.HALF_UP);
    }

    private BidScoreResponse createNewScore(CreateBidScoreRequest request, BidCriteria criteria) {
        BidScore score = BidScore.builder()
                .bidComparisonId(request.bidComparisonId())
                .criteriaId(request.criteriaId())
                .vendorId(request.vendorId())
                .vendorName(request.vendorName())
                .score(request.score())
                .weightedScore(calculateWeightedScore(request.score(), criteria.getWeight(), criteria.getMaxScore()))
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

    private BidScoreResponse updateExistingScore(BidScore existing, CreateBidScoreRequest request, BidCriteria criteria) {
        BigDecimal oldScore = existing.getScore();
        existing.setScore(request.score());
        existing.setWeightedScore(calculateWeightedScore(request.score(), criteria.getWeight(), criteria.getMaxScore()));
        existing.setScoredAt(Instant.now());
        if (request.comments() != null) {
            existing.setComments(request.comments());
        }
        if (request.vendorName() != null) {
            existing.setVendorName(request.vendorName());
        }
        if (request.scoredById() != null) {
            existing.setScoredById(request.scoredById());
        }

        BidScore saved = bidScoreRepository.save(existing);
        auditService.logUpdate(
                "BidScore",
                saved.getId(),
                "score",
                oldScore != null ? oldScore.toPlainString() : null,
                saved.getScore() != null ? saved.getScore().toPlainString() : null
        );

        log.info("BidScore upsert(update): vendor {} criteria {} score {} -> {} ({})",
                request.vendorId(), request.criteriaId(), oldScore, saved.getScore(), saved.getId());
        return BidScoreResponse.fromEntity(saved);
    }

    private List<VendorTotalScoreResponse> computeEligibleVendorRanking(UUID bidComparisonId) {
        List<BidCriteria> criteria = bidCriteriaRepository
                .findByBidComparisonIdAndDeletedFalseOrderBySortOrderAsc(bidComparisonId);
        if (criteria.isEmpty()) {
            return List.of();
        }

        List<BidScore> scores = bidScoreRepository.findByBidComparisonIdAndDeletedFalse(bidComparisonId);
        if (scores.isEmpty()) {
            return List.of();
        }

        Set<UUID> requiredCriteriaIds = criteria.stream()
                .map(BidCriteria::getId)
                .collect(Collectors.toSet());
        Map<UUID, BidCriteria> criteriaById = criteria.stream()
                .collect(Collectors.toMap(BidCriteria::getId, item -> item));

        Map<UUID, Map<UUID, BidScore>> byVendor = new HashMap<>();
        for (BidScore score : scores) {
            byVendor.computeIfAbsent(score.getVendorId(), ignored -> new HashMap<>())
                    .put(score.getCriteriaId(), score);
        }

        List<VendorTotalScoreResponse> ranking = new ArrayList<>();
        for (Map.Entry<UUID, Map<UUID, BidScore>> vendorEntry : byVendor.entrySet()) {
            Map<UUID, BidScore> vendorScoresByCriteria = vendorEntry.getValue();
            if (!vendorScoresByCriteria.keySet().containsAll(requiredCriteriaIds)) {
                continue;
            }

            BigDecimal total = BigDecimal.ZERO;
            boolean hasValidScoresForAllCriteria = true;
            for (UUID criteriaId : requiredCriteriaIds) {
                BidCriteria criterion = criteriaById.get(criteriaId);
                BidScore score = vendorScoresByCriteria.get(criteriaId);
                if (criterion == null || score == null || score.getScore() == null) {
                    hasValidScoresForAllCriteria = false;
                    break;
                }
                if (score.getScore().compareTo(BigDecimal.ZERO) < 0
                        || score.getScore().compareTo(BigDecimal.valueOf(criterion.getMaxScore())) > 0) {
                    hasValidScoresForAllCriteria = false;
                    break;
                }

                total = total.add(calculateWeightedScore(score.getScore(), criterion.getWeight(), criterion.getMaxScore()));
            }

            if (!hasValidScoresForAllCriteria) {
                continue;
            }

            String vendorName = vendorScoresByCriteria.values().stream()
                    .map(BidScore::getVendorName)
                    .filter(name -> name != null && !name.isBlank())
                    .findFirst()
                    .orElse(vendorEntry.getKey().toString());

            ranking.add(new VendorTotalScoreResponse(vendorEntry.getKey(), vendorName, total));
        }

        ranking.sort(
                Comparator.comparing(VendorTotalScoreResponse::totalWeightedScore).reversed()
                        .thenComparing(VendorTotalScoreResponse::vendorName, String.CASE_INSENSITIVE_ORDER)
        );
        return ranking;
    }

    private void validateCriteriaWeights(UUID bidComparisonId) {
        BigDecimal totalWeight = bidCriteriaRepository.sumWeightByBidComparisonId(bidComparisonId);
        if (totalWeight.compareTo(BigDecimal.valueOf(100)) != 0) {
            throw new IllegalStateException(
                    String.format("Сумма весов критериев должна равняться 100%%. Текущая сумма: %s%%", totalWeight));
        }
    }
}
