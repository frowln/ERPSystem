package com.privod.platform.modules.analytics.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.analytics.domain.ConfidenceLevel;
import com.privod.platform.modules.analytics.domain.PredictionModel;
import com.privod.platform.modules.analytics.domain.PredictionModelType;
import com.privod.platform.modules.analytics.domain.ProjectRiskPrediction;
import com.privod.platform.modules.analytics.domain.RiskFactorCategory;
import com.privod.platform.modules.analytics.domain.RiskFactorWeight;
import com.privod.platform.modules.analytics.repository.PredictionModelRepository;
import com.privod.platform.modules.analytics.repository.ProjectRiskPredictionRepository;
import com.privod.platform.modules.analytics.repository.RiskFactorWeightRepository;
import com.privod.platform.modules.analytics.web.dto.CreatePredictionModelRequest;
import com.privod.platform.modules.analytics.web.dto.CreateRiskFactorWeightRequest;
import com.privod.platform.modules.analytics.web.dto.PredictionModelResponse;
import com.privod.platform.modules.analytics.web.dto.ProjectRiskPredictionResponse;
import com.privod.platform.modules.analytics.web.dto.RiskDashboardResponse;
import com.privod.platform.modules.analytics.web.dto.RiskFactorWeightResponse;
import com.privod.platform.modules.analytics.web.dto.RiskHeatmapEntry;
import com.privod.platform.modules.analytics.web.dto.UpdateRiskFactorWeightRequest;
import com.privod.platform.modules.changeManagement.repository.ChangeOrderRepository;
import com.privod.platform.modules.finance.repository.BudgetRepository;
import com.privod.platform.modules.planning.domain.EvmSnapshot;
import com.privod.platform.modules.planning.repository.EvmSnapshotRepository;
import com.privod.platform.modules.project.domain.Project;
import com.privod.platform.modules.project.domain.ProjectStatus;
import com.privod.platform.modules.project.repository.ProjectRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PredictiveAnalyticsService {

    private final PredictionModelRepository predictionModelRepository;
    private final ProjectRiskPredictionRepository riskPredictionRepository;
    private final RiskFactorWeightRepository riskFactorWeightRepository;
    private final ProjectRepository projectRepository;
    private final EvmSnapshotRepository evmSnapshotRepository;
    private final BudgetRepository budgetRepository;
    private final ChangeOrderRepository changeOrderRepository;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;

    @Value("${privod.predictions.alert-threshold:60.0}")
    private double alertThresholdPercent;

    @Value("${privod.predictions.validity-days:7}")
    private int predictionValidityDays;

    private static final BigDecimal HUNDRED = new BigDecimal("100");
    private static final BigDecimal SPI_WEIGHT = new BigDecimal("0.35");
    private static final BigDecimal CPI_WEIGHT = new BigDecimal("0.25");
    private static final BigDecimal DEFECT_WEIGHT = new BigDecimal("0.15");
    private static final BigDecimal SCHEDULE_WEIGHT = new BigDecimal("0.25");

    private static final BigDecimal BUDGET_VARIANCE_WEIGHT = new BigDecimal("0.35");
    private static final BigDecimal CHANGE_ORDER_WEIGHT = new BigDecimal("0.25");
    private static final BigDecimal CPI_COST_WEIGHT = new BigDecimal("0.30");
    private static final BigDecimal OVERRUN_SCHEDULE_WEIGHT = new BigDecimal("0.10");

    // --- Prediction Model CRUD ---

    @Transactional(readOnly = true)
    public Page<PredictionModelResponse> findAllModels(Pageable pageable) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        return predictionModelRepository.findByOrganizationIdAndDeletedFalse(orgId, pageable)
                .map(PredictionModelResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public PredictionModelResponse findModelById(UUID id) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        PredictionModel model = predictionModelRepository
                .findByIdAndOrganizationIdAndDeletedFalse(id, orgId)
                .orElseThrow(() -> new EntityNotFoundException("Модель прогнозирования не найдена: " + id));
        return PredictionModelResponse.fromEntity(model);
    }

    @Transactional
    public PredictionModelResponse createModel(CreatePredictionModelRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        PredictionModel model = PredictionModel.builder()
                .organizationId(orgId)
                .modelType(request.modelType())
                .name(request.name())
                .description(request.description())
                .trainingDataJson(request.trainingDataJson() != null ? request.trainingDataJson() : "{}")
                .isActive(true)
                .trainedAt(Instant.now())
                .build();

        model = predictionModelRepository.save(model);
        auditService.logCreate("PredictionModel", model.getId());
        log.info("Prediction model created: {} ({}) for org {}", model.getName(), model.getId(), orgId);

        return PredictionModelResponse.fromEntity(model);
    }

    @Transactional
    public void deleteModel(UUID id) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        PredictionModel model = predictionModelRepository
                .findByIdAndOrganizationIdAndDeletedFalse(id, orgId)
                .orElseThrow(() -> new EntityNotFoundException("Модель прогнозирования не найдена: " + id));
        model.softDelete();
        predictionModelRepository.save(model);
        auditService.logDelete("PredictionModel", id);
        log.info("Prediction model deleted: {} ({})", model.getName(), id);
    }

    // --- Risk Factor Weight CRUD ---

    @Transactional(readOnly = true)
    public Page<RiskFactorWeightResponse> findAllWeights(Pageable pageable) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        return riskFactorWeightRepository
                .findByOrganizationIdAndDeletedFalseOrderByFactorCategoryAscWeightValueDesc(orgId, pageable)
                .map(RiskFactorWeightResponse::fromEntity);
    }

    @Transactional
    public RiskFactorWeightResponse createWeight(CreateRiskFactorWeightRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        RiskFactorWeight weight = RiskFactorWeight.builder()
                .organizationId(orgId)
                .factorName(request.factorName())
                .factorCategory(request.factorCategory())
                .weightValue(request.weightValue() != null ? request.weightValue() : BigDecimal.ONE)
                .description(request.description())
                .build();

        weight = riskFactorWeightRepository.save(weight);
        auditService.logCreate("RiskFactorWeight", weight.getId());
        log.info("Risk factor weight created: {} ({}) for org {}", weight.getFactorName(), weight.getId(), orgId);

        return RiskFactorWeightResponse.fromEntity(weight);
    }

    @Transactional
    public RiskFactorWeightResponse updateWeight(UUID id, UpdateRiskFactorWeightRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        RiskFactorWeight weight = riskFactorWeightRepository
                .findByIdAndOrganizationIdAndDeletedFalse(id, orgId)
                .orElseThrow(() -> new EntityNotFoundException("Весовой коэффициент риска не найден: " + id));

        if (request.factorName() != null) {
            weight.setFactorName(request.factorName());
        }
        if (request.factorCategory() != null) {
            weight.setFactorCategory(request.factorCategory());
        }
        if (request.weightValue() != null) {
            weight.setWeightValue(request.weightValue());
        }
        if (request.description() != null) {
            weight.setDescription(request.description());
        }

        weight = riskFactorWeightRepository.save(weight);
        auditService.logUpdate("RiskFactorWeight", weight.getId(), "multiple", null, null);

        return RiskFactorWeightResponse.fromEntity(weight);
    }

    @Transactional
    public void deleteWeight(UUID id) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        RiskFactorWeight weight = riskFactorWeightRepository
                .findByIdAndOrganizationIdAndDeletedFalse(id, orgId)
                .orElseThrow(() -> new EntityNotFoundException("Весовой коэффициент риска не найден: " + id));
        weight.softDelete();
        riskFactorWeightRepository.save(weight);
        auditService.logDelete("RiskFactorWeight", id);
    }

    // --- Predictions ---

    @Transactional(readOnly = true)
    public Page<ProjectRiskPredictionResponse> findPredictions(UUID projectId, Pageable pageable) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        if (projectId != null) {
            return riskPredictionRepository
                    .findByProjectIdAndOrganizationIdAndDeletedFalseOrderByPredictedAtDesc(
                            projectId, orgId, pageable)
                    .map(ProjectRiskPredictionResponse::fromEntity);
        }
        return riskPredictionRepository
                .findByOrganizationIdAndDeletedFalseOrderByPredictedAtDesc(orgId, pageable)
                .map(ProjectRiskPredictionResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public List<ProjectRiskPredictionResponse> findActiveAlerts() {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        return riskPredictionRepository.findActiveAlerts(orgId, Instant.now())
                .stream()
                .map(ProjectRiskPredictionResponse::fromEntity)
                .toList();
    }

    @Transactional
    public ProjectRiskPredictionResponse calculateDelayProbability(UUID projectId) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        Project project = getProjectOrThrow(projectId, orgId);

        // Gather signals
        BigDecimal spiScore = calculateSpiScore(projectId);
        BigDecimal scheduleScore = calculateScheduleSlippageScore(project);
        BigDecimal changeOrderScore = calculateChangeOrderImpactScore(projectId);

        // Weighted combination -> probability %
        BigDecimal probability = spiScore.multiply(SPI_WEIGHT)
                .add(scheduleScore.multiply(SCHEDULE_WEIGHT))
                .add(changeOrderScore.multiply(DEFECT_WEIGHT))
                .add(calculateCpiBasedDelayScore(projectId).multiply(CPI_WEIGHT))
                .min(HUNDRED)
                .max(BigDecimal.ZERO)
                .setScale(2, RoundingMode.HALF_UP);

        int predictedDays = estimateDelayDays(project, probability);
        String riskFactors = buildRiskFactorsJson(projectId, orgId, PredictionModelType.DELAY);

        boolean shouldAlert = probability.doubleValue() >= alertThresholdPercent;

        ProjectRiskPrediction prediction = ProjectRiskPrediction.builder()
                .organizationId(orgId)
                .projectId(projectId)
                .predictionType(PredictionModelType.DELAY)
                .probabilityPercent(probability)
                .confidenceLevel(determineConfidence(projectId))
                .riskFactorsJson(riskFactors)
                .predictedDelayDays(predictedDays)
                .alertGenerated(shouldAlert)
                .predictedAt(Instant.now())
                .validUntil(Instant.now().plus(predictionValidityDays, ChronoUnit.DAYS))
                .build();

        prediction = riskPredictionRepository.save(prediction);
        auditService.logCreate("ProjectRiskPrediction", prediction.getId());

        if (shouldAlert) {
            log.warn("HIGH RISK ALERT: Project {} delay probability {}%", project.getName(), probability);
        }

        return ProjectRiskPredictionResponse.fromEntity(prediction);
    }

    @Transactional
    public ProjectRiskPredictionResponse calculateCostOverrunProbability(UUID projectId) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        Project project = getProjectOrThrow(projectId, orgId);

        BigDecimal budgetVarianceScore = calculateBudgetVarianceScore(projectId);
        BigDecimal changeOrderCostScore = calculateChangeOrderCostScore(projectId);
        BigDecimal cpiCostScore = calculateCpiCostScore(projectId);
        BigDecimal scheduleOverrunCostScore = calculateScheduleOverrunCostImpact(project);

        BigDecimal probability = budgetVarianceScore.multiply(BUDGET_VARIANCE_WEIGHT)
                .add(changeOrderCostScore.multiply(CHANGE_ORDER_WEIGHT))
                .add(cpiCostScore.multiply(CPI_COST_WEIGHT))
                .add(scheduleOverrunCostScore.multiply(OVERRUN_SCHEDULE_WEIGHT))
                .min(HUNDRED)
                .max(BigDecimal.ZERO)
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal overrunAmount = estimateOverrunAmount(projectId, probability);
        String riskFactors = buildRiskFactorsJson(projectId, orgId, PredictionModelType.COST_OVERRUN);

        boolean shouldAlert = probability.doubleValue() >= alertThresholdPercent;

        ProjectRiskPrediction prediction = ProjectRiskPrediction.builder()
                .organizationId(orgId)
                .projectId(projectId)
                .predictionType(PredictionModelType.COST_OVERRUN)
                .probabilityPercent(probability)
                .confidenceLevel(determineConfidence(projectId))
                .riskFactorsJson(riskFactors)
                .predictedOverrunAmount(overrunAmount)
                .alertGenerated(shouldAlert)
                .predictedAt(Instant.now())
                .validUntil(Instant.now().plus(predictionValidityDays, ChronoUnit.DAYS))
                .build();

        prediction = riskPredictionRepository.save(prediction);
        auditService.logCreate("ProjectRiskPrediction", prediction.getId());

        if (shouldAlert) {
            log.warn("HIGH RISK ALERT: Project {} cost overrun probability {}%", project.getName(), probability);
        }

        return ProjectRiskPredictionResponse.fromEntity(prediction);
    }

    // --- Dashboard ---

    @Transactional(readOnly = true)
    public RiskDashboardResponse getRiskDashboard() {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        Instant now = Instant.now();

        List<ProjectRiskPrediction> activeAlerts = riskPredictionRepository.findActiveAlerts(orgId, now);
        List<ProjectRiskPrediction> highRisks = riskPredictionRepository.findHighRiskPredictions(
                orgId, new BigDecimal(alertThresholdPercent), now);

        List<UUID> projectIds = riskPredictionRepository.findProjectIdsWithActivePredictions(orgId, now);
        List<Object[]> projectNames = projectIds.isEmpty()
                ? List.of()
                : projectRepository.findNamesByIdsAndOrganizationId(projectIds, orgId);
        Map<UUID, String> nameMap = new HashMap<>();
        for (Object[] row : projectNames) {
            nameMap.put((UUID) row[0], (String) row[1]);
        }

        List<RiskHeatmapEntry> heatmap = new ArrayList<>();
        int highCount = 0;
        int mediumCount = 0;
        int lowCount = 0;

        for (UUID pid : projectIds) {
            BigDecimal delayProb = getLatestProbability(pid, PredictionModelType.DELAY);
            BigDecimal costProb = getLatestProbability(pid, PredictionModelType.COST_OVERRUN);
            BigDecimal qualityProb = getLatestProbability(pid, PredictionModelType.QUALITY_RISK);
            BigDecimal maxProb = delayProb.max(costProb).max(qualityProb);

            String riskLevel;
            if (maxProb.doubleValue() >= 70) {
                riskLevel = "HIGH";
                highCount++;
            } else if (maxProb.doubleValue() >= 40) {
                riskLevel = "MEDIUM";
                mediumCount++;
            } else {
                riskLevel = "LOW";
                lowCount++;
            }

            long alertCount = riskPredictionRepository
                    .countByProjectIdAndAlertGeneratedTrueAndDeletedFalse(pid);

            heatmap.add(new RiskHeatmapEntry(
                    pid,
                    nameMap.getOrDefault(pid, "Unknown"),
                    delayProb,
                    costProb,
                    qualityProb,
                    riskLevel,
                    (int) alertCount
            ));
        }

        heatmap.sort(Comparator.comparing(
                (RiskHeatmapEntry e) -> e.delayProbability().max(e.costOverrunProbability()))
                .reversed());

        List<ProjectRiskPredictionResponse> topRisks = highRisks.stream()
                .limit(10)
                .map(ProjectRiskPredictionResponse::fromEntity)
                .toList();

        return new RiskDashboardResponse(
                projectIds.size(),
                highCount,
                mediumCount,
                lowCount,
                activeAlerts.size(),
                heatmap,
                topRisks
        );
    }

    // --- Scheduled daily prediction refresh ---

    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void refreshPredictionsForActiveProjects() {
        log.info("Starting daily prediction refresh for active projects");

        List<UUID> orgIds = getDistinctOrganizationIds();

        int totalUpdated = 0;
        for (UUID orgId : orgIds) {
            List<UUID> activeProjectIds = projectRepository.findActiveProjectIdsByOrganizationId(orgId);
            for (UUID projectId : activeProjectIds) {
                try {
                    refreshProjectPredictions(projectId, orgId);
                    totalUpdated++;
                } catch (Exception e) {
                    log.error("Failed to refresh predictions for project {}: {}", projectId, e.getMessage());
                }
            }
        }

        log.info("Daily prediction refresh completed: {} projects updated", totalUpdated);
    }

    // --- Internal calculation methods ---

    private void refreshProjectPredictions(UUID projectId, UUID orgId) {
        Project project = projectRepository.findByIdAndOrganizationIdAndDeletedFalse(projectId, orgId)
                .orElse(null);
        if (project == null || project.getStatus() == ProjectStatus.COMPLETED
                || project.getStatus() == ProjectStatus.CANCELLED) {
            return;
        }

        // Delay prediction
        BigDecimal spiScore = calculateSpiScore(projectId);
        BigDecimal scheduleScore = calculateScheduleSlippageScore(project);
        BigDecimal changeOrderImpact = calculateChangeOrderImpactScore(projectId);
        BigDecimal cpiDelayScore = calculateCpiBasedDelayScore(projectId);

        BigDecimal delayProb = spiScore.multiply(SPI_WEIGHT)
                .add(scheduleScore.multiply(SCHEDULE_WEIGHT))
                .add(changeOrderImpact.multiply(DEFECT_WEIGHT))
                .add(cpiDelayScore.multiply(CPI_WEIGHT))
                .min(HUNDRED).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);

        savePrediction(orgId, projectId, PredictionModelType.DELAY, delayProb,
                estimateDelayDays(project, delayProb), null,
                buildRiskFactorsJson(projectId, orgId, PredictionModelType.DELAY));

        // Cost overrun prediction
        BigDecimal budgetVariance = calculateBudgetVarianceScore(projectId);
        BigDecimal changeCost = calculateChangeOrderCostScore(projectId);
        BigDecimal cpiCost = calculateCpiCostScore(projectId);
        BigDecimal scheduleOverrunCost = calculateScheduleOverrunCostImpact(project);

        BigDecimal costProb = budgetVariance.multiply(BUDGET_VARIANCE_WEIGHT)
                .add(changeCost.multiply(CHANGE_ORDER_WEIGHT))
                .add(cpiCost.multiply(CPI_COST_WEIGHT))
                .add(scheduleOverrunCost.multiply(OVERRUN_SCHEDULE_WEIGHT))
                .min(HUNDRED).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);

        savePrediction(orgId, projectId, PredictionModelType.COST_OVERRUN, costProb,
                null, estimateOverrunAmount(projectId, costProb),
                buildRiskFactorsJson(projectId, orgId, PredictionModelType.COST_OVERRUN));
    }

    private void savePrediction(UUID orgId, UUID projectId, PredictionModelType type,
                                BigDecimal probability, Integer delayDays, BigDecimal overrunAmount,
                                String riskFactors) {
        boolean shouldAlert = probability.doubleValue() >= alertThresholdPercent;

        ProjectRiskPrediction prediction = ProjectRiskPrediction.builder()
                .organizationId(orgId)
                .projectId(projectId)
                .predictionType(type)
                .probabilityPercent(probability)
                .confidenceLevel(determineConfidenceInternal(projectId))
                .riskFactorsJson(riskFactors)
                .predictedDelayDays(delayDays)
                .predictedOverrunAmount(overrunAmount)
                .alertGenerated(shouldAlert)
                .predictedAt(Instant.now())
                .validUntil(Instant.now().plus(predictionValidityDays, ChronoUnit.DAYS))
                .build();

        riskPredictionRepository.save(prediction);

        if (shouldAlert) {
            log.warn("ALERT: Project {} — {} probability {}%", projectId, type.getDisplayName(), probability);
        }
    }

    /**
     * SPI-based delay score: SPI < 1.0 means behind schedule.
     * Score: (1 - SPI) * 100, capped at 0-100.
     */
    private BigDecimal calculateSpiScore(UUID projectId) {
        Optional<EvmSnapshot> latestEvm = evmSnapshotRepository.findLatestByProjectId(projectId);
        if (latestEvm.isEmpty() || latestEvm.get().getSpi() == null) {
            return new BigDecimal("30"); // default moderate risk when no EVM data
        }
        BigDecimal spi = latestEvm.get().getSpi();
        if (spi.compareTo(BigDecimal.ONE) >= 0) {
            return BigDecimal.ZERO; // on or ahead of schedule
        }
        // e.g. SPI=0.8 -> score=20, SPI=0.5 -> score=50
        return BigDecimal.ONE.subtract(spi).multiply(HUNDRED)
                .min(HUNDRED).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Schedule slippage score based on planned vs actual dates.
     */
    private BigDecimal calculateScheduleSlippageScore(Project project) {
        if (project.getPlannedEndDate() == null) {
            return new BigDecimal("20");
        }
        LocalDate now = LocalDate.now();
        long totalDuration = ChronoUnit.DAYS.between(
                project.getPlannedStartDate() != null ? project.getPlannedStartDate() : now.minusMonths(6),
                project.getPlannedEndDate());
        if (totalDuration <= 0) totalDuration = 1;

        long daysRemaining = ChronoUnit.DAYS.between(now, project.getPlannedEndDate());
        if (daysRemaining < 0) {
            // Already past deadline — high risk
            long overdueDays = Math.abs(daysRemaining);
            return BigDecimal.valueOf(Math.min(50 + overdueDays, 100));
        }

        // % of schedule consumed with closer deadline => higher risk
        double consumed = 1.0 - ((double) daysRemaining / totalDuration);
        if (consumed < 0.5) return BigDecimal.ZERO;
        // Scale: 50% consumed = 0, 100% consumed = 80
        return BigDecimal.valueOf((consumed - 0.5) * 160)
                .min(HUNDRED).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Change order impact score: more change orders = higher delay risk.
     */
    private BigDecimal calculateChangeOrderImpactScore(UUID projectId) {
        long count = changeOrderRepository.countByProjectIdAndDeletedFalse(projectId);
        // Each change order adds ~8 points of risk, capped at 100
        return BigDecimal.valueOf(Math.min(count * 8, 100))
                .setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * CPI-based delay contribution: cost overruns often cause schedule delays.
     */
    private BigDecimal calculateCpiBasedDelayScore(UUID projectId) {
        Optional<EvmSnapshot> latestEvm = evmSnapshotRepository.findLatestByProjectId(projectId);
        if (latestEvm.isEmpty() || latestEvm.get().getCpi() == null) {
            return new BigDecimal("20");
        }
        BigDecimal cpi = latestEvm.get().getCpi();
        if (cpi.compareTo(BigDecimal.ONE) >= 0) {
            return BigDecimal.ZERO;
        }
        return BigDecimal.ONE.subtract(cpi).multiply(HUNDRED)
                .min(HUNDRED).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Budget variance score: actual vs planned cost divergence.
     */
    private BigDecimal calculateBudgetVarianceScore(UUID projectId) {
        BigDecimal planned = budgetRepository.sumPlannedCostByProjectId(projectId);
        BigDecimal actual = budgetRepository.sumActualCostByProjectId(projectId);

        if (planned == null || planned.compareTo(BigDecimal.ZERO) == 0) {
            return new BigDecimal("25");
        }

        BigDecimal variance = actual.subtract(planned).divide(planned, 4, RoundingMode.HALF_UP);
        if (variance.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO; // under budget
        }
        // 5% overrun = 50 score, 10% overrun = 100 score
        return variance.multiply(new BigDecimal("1000"))
                .min(HUNDRED).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Change order cost impact score.
     */
    private BigDecimal calculateChangeOrderCostScore(UUID projectId) {
        long count = changeOrderRepository.countByProjectIdAndDeletedFalse(projectId);
        return BigDecimal.valueOf(Math.min(count * 10, 100))
                .setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * CPI-based cost overrun score.
     */
    private BigDecimal calculateCpiCostScore(UUID projectId) {
        Optional<EvmSnapshot> latestEvm = evmSnapshotRepository.findLatestByProjectId(projectId);
        if (latestEvm.isEmpty() || latestEvm.get().getCpi() == null) {
            return new BigDecimal("25");
        }
        BigDecimal cpi = latestEvm.get().getCpi();
        if (cpi.compareTo(BigDecimal.ONE) >= 0) {
            return BigDecimal.ZERO;
        }
        // CPI=0.8 -> 20%, CPI=0.5 -> 50%
        return BigDecimal.ONE.subtract(cpi).multiply(HUNDRED)
                .min(HUNDRED).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Schedule delay impact on costs: overdue projects incur additional costs.
     */
    private BigDecimal calculateScheduleOverrunCostImpact(Project project) {
        if (project.getPlannedEndDate() == null) {
            return new BigDecimal("15");
        }
        long daysRemaining = ChronoUnit.DAYS.between(LocalDate.now(), project.getPlannedEndDate());
        if (daysRemaining >= 0) {
            return BigDecimal.ZERO;
        }
        // Each overdue day adds 2 risk points
        return BigDecimal.valueOf(Math.min(Math.abs(daysRemaining) * 2, 100))
                .setScale(2, RoundingMode.HALF_UP);
    }

    private int estimateDelayDays(Project project, BigDecimal probability) {
        if (project.getPlannedEndDate() == null) return 0;
        long totalDuration = ChronoUnit.DAYS.between(
                project.getPlannedStartDate() != null ? project.getPlannedStartDate() : LocalDate.now().minusMonths(6),
                project.getPlannedEndDate());
        // Estimated delay = probability/100 * 30% of total duration
        return probability.multiply(BigDecimal.valueOf(totalDuration))
                .multiply(new BigDecimal("0.003"))
                .setScale(0, RoundingMode.HALF_UP)
                .intValue();
    }

    private BigDecimal estimateOverrunAmount(UUID projectId, BigDecimal probability) {
        BigDecimal planned = budgetRepository.sumPlannedCostByProjectId(projectId);
        if (planned == null || planned.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        // Estimated overrun = probability/100 * 10% of planned budget
        return probability.multiply(planned)
                .multiply(new BigDecimal("0.001"))
                .setScale(2, RoundingMode.HALF_UP);
    }

    private ConfidenceLevel determineConfidence(UUID projectId) {
        return determineConfidenceInternal(projectId);
    }

    private ConfidenceLevel determineConfidenceInternal(UUID projectId) {
        Optional<EvmSnapshot> latestEvm = evmSnapshotRepository.findLatestByProjectId(projectId);
        if (latestEvm.isEmpty()) {
            return ConfidenceLevel.LOW;
        }
        // Check how many EVM data points exist
        List<EvmSnapshot> snapshots = evmSnapshotRepository
                .findByProjectIdAndDeletedFalseOrderBySnapshotDateDesc(projectId);
        if (snapshots.size() >= 10) {
            return ConfidenceLevel.HIGH;
        } else if (snapshots.size() >= 3) {
            return ConfidenceLevel.MEDIUM;
        }
        return ConfidenceLevel.LOW;
    }

    private String buildRiskFactorsJson(UUID projectId, UUID orgId, PredictionModelType type) {
        List<RiskFactorWeight> weights = riskFactorWeightRepository
                .findByOrganizationIdAndDeletedFalse(orgId);

        List<Map<String, Object>> factors = new ArrayList<>();
        Optional<EvmSnapshot> latestEvm = evmSnapshotRepository.findLatestByProjectId(projectId);

        // EVM-based factors
        if (latestEvm.isPresent()) {
            EvmSnapshot evm = latestEvm.get();
            if (evm.getSpi() != null && evm.getSpi().compareTo(BigDecimal.ONE) < 0) {
                factors.add(createFactor("SPI ниже нормы", RiskFactorCategory.FINANCIAL,
                        BigDecimal.ONE.subtract(evm.getSpi()).multiply(HUNDRED), getWeight(weights, "SPI")));
            }
            if (evm.getCpi() != null && evm.getCpi().compareTo(BigDecimal.ONE) < 0) {
                factors.add(createFactor("CPI ниже нормы", RiskFactorCategory.FINANCIAL,
                        BigDecimal.ONE.subtract(evm.getCpi()).multiply(HUNDRED), getWeight(weights, "CPI")));
            }
        }

        // Change orders factor
        long changeOrders = changeOrderRepository.countByProjectIdAndDeletedFalse(projectId);
        if (changeOrders > 0) {
            factors.add(createFactor("Изменения в проекте (" + changeOrders + " шт.)",
                    RiskFactorCategory.SUBCONTRACTOR,
                    BigDecimal.valueOf(Math.min(changeOrders * 10, 100)),
                    getWeight(weights, "CHANGE_ORDERS")));
        }

        // Budget variance factor
        if (type == PredictionModelType.COST_OVERRUN) {
            BigDecimal planned = budgetRepository.sumPlannedCostByProjectId(projectId);
            BigDecimal actual = budgetRepository.sumActualCostByProjectId(projectId);
            if (planned != null && planned.compareTo(BigDecimal.ZERO) > 0 && actual != null) {
                BigDecimal variance = actual.subtract(planned).divide(planned, 4, RoundingMode.HALF_UP)
                        .multiply(HUNDRED);
                if (variance.compareTo(BigDecimal.ZERO) > 0) {
                    factors.add(createFactor("Превышение бюджета: " + variance.setScale(1, RoundingMode.HALF_UP) + "%",
                            RiskFactorCategory.FINANCIAL, variance.min(HUNDRED),
                            getWeight(weights, "BUDGET_VARIANCE")));
                }
            }
        }

        // Sort by impact descending
        factors.sort((a, b) -> {
            BigDecimal impactA = (BigDecimal) a.get("impact");
            BigDecimal impactB = (BigDecimal) b.get("impact");
            return impactB.compareTo(impactA);
        });

        try {
            return objectMapper.writeValueAsString(factors);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize risk factors", e);
            return "[]";
        }
    }

    private Map<String, Object> createFactor(String name, RiskFactorCategory category,
                                              BigDecimal impact, BigDecimal weight) {
        Map<String, Object> factor = new HashMap<>();
        factor.put("name", name);
        factor.put("category", category.name());
        factor.put("categoryDisplayName", category.getDisplayName());
        factor.put("impact", impact.setScale(2, RoundingMode.HALF_UP));
        factor.put("weight", weight);
        return factor;
    }

    private BigDecimal getWeight(List<RiskFactorWeight> weights, String factorName) {
        return weights.stream()
                .filter(w -> w.getFactorName().equalsIgnoreCase(factorName))
                .findFirst()
                .map(RiskFactorWeight::getWeightValue)
                .orElse(BigDecimal.ONE);
    }

    private BigDecimal getLatestProbability(UUID projectId, PredictionModelType type) {
        return riskPredictionRepository.findLatestByProjectIdAndType(projectId, type)
                .map(ProjectRiskPrediction::getProbabilityPercent)
                .orElse(BigDecimal.ZERO);
    }

    private Project getProjectOrThrow(UUID projectId, UUID orgId) {
        return projectRepository.findByIdAndOrganizationIdAndDeletedFalse(projectId, orgId)
                .orElseThrow(() -> new EntityNotFoundException("Проект не найден: " + projectId));
    }

    private List<UUID> getDistinctOrganizationIds() {
        // Get distinct org IDs from active projects
        return projectRepository.findAll().stream()
                .filter(p -> !p.isDeleted())
                .filter(p -> p.getStatus() == ProjectStatus.IN_PROGRESS || p.getStatus() == ProjectStatus.PLANNING)
                .map(Project::getOrganizationId)
                .distinct()
                .toList();
    }
}
