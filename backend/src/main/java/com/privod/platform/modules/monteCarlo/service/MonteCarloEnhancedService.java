package com.privod.platform.modules.monteCarlo.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.monteCarlo.domain.MonteCarloEacResult;
import com.privod.platform.modules.monteCarlo.domain.MonteCarloSimulation;
import com.privod.platform.modules.monteCarlo.domain.MonteCarloTask;
import com.privod.platform.modules.monteCarlo.repository.MonteCarloEacResultRepository;
import com.privod.platform.modules.monteCarlo.repository.MonteCarloSimulationRepository;
import com.privod.platform.modules.monteCarlo.repository.MonteCarloTaskRepository;
import com.privod.platform.modules.monteCarlo.web.dto.EacTrajectoryPoint;
import com.privod.platform.modules.monteCarlo.web.dto.InsightItem;
import com.privod.platform.modules.monteCarlo.web.dto.MonteCarloEacResultResponse;
import com.privod.platform.modules.planning.domain.EvmSnapshot;
import com.privod.platform.modules.planning.repository.EvmSnapshotRepository;
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
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
@Slf4j
public class MonteCarloEnhancedService {

    private static final int HISTOGRAM_BINS = 20;
    private static final int SCALE = 2;
    private static final RoundingMode RM = RoundingMode.HALF_UP;

    private final MonteCarloSimulationRepository simulationRepository;
    private final MonteCarloTaskRepository taskRepository;
    private final MonteCarloEacResultRepository eacResultRepository;
    private final EvmSnapshotRepository evmSnapshotRepository;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;

    // ---- Run enhanced simulation ----

    @Transactional
    public MonteCarloEacResultResponse runSimulation(UUID simulationId, int iterations) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        MonteCarloSimulation simulation = simulationRepository.findById(simulationId)
                .filter(s -> !s.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Симуляция Монте-Карло не найдена: " + simulationId));

        UUID projectId = simulation.getProjectId();
        if (projectId == null) {
            throw new IllegalStateException("Симуляция не привязана к проекту");
        }

        List<MonteCarloTask> tasks = taskRepository.findBySimulationIdAndDeletedFalse(simulationId);
        if (tasks.isEmpty()) {
            throw new IllegalStateException("Невозможно запустить симуляцию без задач");
        }

        // Load latest EVM data
        Optional<EvmSnapshot> latestEvm = evmSnapshotRepository.findLatestByProjectId(projectId);

        BigDecimal bac = latestEvm.map(EvmSnapshot::getBudgetAtCompletion).orElse(null);
        BigDecimal ev = latestEvm.map(EvmSnapshot::getEarnedValue).orElse(null);
        BigDecimal ac = latestEvm.map(EvmSnapshot::getActualCost).orElse(null);
        BigDecimal cpi = latestEvm.map(EvmSnapshot::getCpi).orElse(BigDecimal.ONE);
        BigDecimal spi = latestEvm.map(EvmSnapshot::getSpi).orElse(BigDecimal.ONE);

        // Derive base cost from BAC or sum of task durations * unit cost
        // If BAC exists, use it; otherwise estimate from tasks
        double baseCostDouble = bac != null ? bac.doubleValue() : estimateBaseCost(tasks);
        double baseDurationDouble = simulation.getBaselineDuration() != null
                ? simulation.getBaselineDuration()
                : estimateBaseDuration(tasks);

        // CPI/SPI modifiers (use 1.0 if not available)
        double cpiMod = cpi.doubleValue();
        double spiMod = spi.doubleValue();

        // Run Monte Carlo iterations
        double[] costSamples = new double[iterations];
        double[] scheduleSamples = new double[iterations];

        for (int i = 0; i < iterations; i++) {
            double totalCost = 0.0;
            double totalDuration = 0.0;

            for (MonteCarloTask task : tasks) {
                double min = task.getOptimisticDuration();
                double mode = task.getMostLikelyDuration();
                double max = task.getPessimisticDuration();

                double sampledDuration = sampleTriangular(min, mode, max);
                totalDuration += sampledDuration;

                // Cost = duration * (baseCost / baseDuration) with CPI adjustment
                double costPerDay = baseCostDouble / baseDurationDouble;
                totalCost += sampledDuration * costPerDay;
            }

            // Apply CPI/SPI modifiers: worse CPI => higher cost, worse SPI => longer schedule
            if (cpiMod > 0) {
                costSamples[i] = totalCost / cpiMod;
            } else {
                costSamples[i] = totalCost;
            }
            if (spiMod > 0) {
                scheduleSamples[i] = totalDuration / spiMod;
            } else {
                scheduleSamples[i] = totalDuration;
            }
        }

        // Sort for percentile calculations
        Arrays.sort(costSamples);
        Arrays.sort(scheduleSamples);

        // Calculate percentiles
        BigDecimal costP10 = percentile(costSamples, 10);
        BigDecimal costP50 = percentile(costSamples, 50);
        BigDecimal costP90 = percentile(costSamples, 90);
        BigDecimal costMean = mean(costSamples);
        BigDecimal costStdDev = stdDev(costSamples, costMean.doubleValue());

        Integer scheduleP10 = (int) Math.round(percentile(scheduleSamples, 10).doubleValue());
        Integer scheduleP50 = (int) Math.round(percentile(scheduleSamples, 50).doubleValue());
        Integer scheduleP90 = (int) Math.round(percentile(scheduleSamples, 90).doubleValue());
        BigDecimal scheduleMean = mean(scheduleSamples);

        // Calculate TCPI
        BigDecimal tcpiBac = calculateTcpiBac(bac, ev, ac);
        BigDecimal tcpiEac = calculateTcpiEac(bac, ev, ac, costP50);

        // Generate EAC trajectory from historical EVM snapshots
        List<EacTrajectoryPoint> trajectory = buildEacTrajectory(projectId);
        // Add current simulation result as the latest point
        trajectory.add(new EacTrajectoryPoint(
                LocalDate.now().toString(),
                costP50,
                cpi,
                spi
        ));

        // Generate confidence bands
        Map<String, Object> confidenceBands = buildConfidenceBands(costSamples, scheduleSamples);

        // Generate insights
        List<InsightItem> insights = generateInsights(
                costP50, bac, scheduleP50, scheduleP10, scheduleP90,
                tcpiBac, cpi, spi, tasks);

        // Generate histograms
        List<Map<String, Object>> costHistogram = buildHistogram(costSamples);
        List<Map<String, Object>> scheduleHistogram = buildHistogram(scheduleSamples);

        // Serialize JSON fields
        String eacTrajectoryJson = toJson(trajectory);
        String confidenceBandsJson = toJson(confidenceBands);
        String insightsJson = toJson(insights);
        String costHistogramJson = toJson(costHistogram);
        String scheduleHistogramJson = toJson(scheduleHistogram);

        // Save result
        MonteCarloEacResult result = MonteCarloEacResult.builder()
                .organizationId(orgId)
                .simulationId(simulationId)
                .projectId(projectId)
                .iterations(iterations)
                .costP10(costP10)
                .costP50(costP50)
                .costP90(costP90)
                .costMean(costMean)
                .costStdDev(costStdDev)
                .scheduleP10(scheduleP10)
                .scheduleP50(scheduleP50)
                .scheduleP90(scheduleP90)
                .scheduleMean(scheduleMean)
                .eacTrajectoryJson(eacTrajectoryJson)
                .tcpiBac(tcpiBac)
                .tcpiEac(tcpiEac)
                .confidenceBandsJson(confidenceBandsJson)
                .insightsJson(insightsJson)
                .costHistogramJson(costHistogramJson)
                .scheduleHistogramJson(scheduleHistogramJson)
                .calculatedAt(Instant.now())
                .build();

        result = eacResultRepository.save(result);
        auditService.logCreate("MonteCarloEacResult", result.getId());

        log.info("Расширенная симуляция Монте-Карло завершена: simulation={}, project={}, " +
                        "costP50={}, scheduleP50={} дн., iterations={} ({})",
                simulationId, projectId, costP50, scheduleP50, iterations, result.getId());

        return MonteCarloEacResultResponse.fromEntity(result);
    }

    // ---- Query methods ----

    @Transactional(readOnly = true)
    public MonteCarloEacResultResponse getLatestResult(UUID projectId) {
        return eacResultRepository.findLatestByProjectId(projectId)
                .map(MonteCarloEacResultResponse::fromEntity)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Результаты симуляции не найдены для проекта: " + projectId));
    }

    @Transactional(readOnly = true)
    public Page<MonteCarloEacResultResponse> getResultHistory(UUID projectId, Pageable pageable) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        return eacResultRepository
                .findByOrganizationIdAndProjectIdAndDeletedFalseOrderByCalculatedAtDesc(
                        orgId, projectId, pageable)
                .map(MonteCarloEacResultResponse::fromEntity);
    }

    // ---- Triangular distribution sampling ----

    /**
     * Samples from triangular distribution using inverse CDF.
     * If U < (mode-min)/(max-min), then X = min + sqrt(U*(max-min)*(mode-min))
     * else X = max - sqrt((1-U)*(max-min)*(max-mode))
     */
    private double sampleTriangular(double min, double mode, double max) {
        if (min == max) {
            return min;
        }
        double u = ThreadLocalRandom.current().nextDouble();
        double range = max - min;
        double threshold = (mode - min) / range;

        if (u < threshold) {
            return min + Math.sqrt(u * range * (mode - min));
        } else {
            return max - Math.sqrt((1.0 - u) * range * (max - mode));
        }
    }

    // ---- Statistical helpers ----

    private BigDecimal percentile(double[] sorted, int p) {
        double index = (p / 100.0) * (sorted.length - 1);
        int lower = (int) Math.floor(index);
        int upper = Math.min(lower + 1, sorted.length - 1);
        double fraction = index - lower;
        double value = sorted[lower] + fraction * (sorted[upper] - sorted[lower]);
        return BigDecimal.valueOf(value).setScale(SCALE, RM);
    }

    private BigDecimal mean(double[] samples) {
        double sum = 0;
        for (double s : samples) {
            sum += s;
        }
        return BigDecimal.valueOf(sum / samples.length).setScale(SCALE, RM);
    }

    private BigDecimal stdDev(double[] samples, double mean) {
        double sumSq = 0;
        for (double s : samples) {
            double diff = s - mean;
            sumSq += diff * diff;
        }
        return BigDecimal.valueOf(Math.sqrt(sumSq / samples.length)).setScale(SCALE, RM);
    }

    // ---- Cost/duration estimation ----

    private double estimateBaseCost(List<MonteCarloTask> tasks) {
        // Approximate using PERT mean of task durations * 1000 (unit cost placeholder)
        double total = 0;
        for (MonteCarloTask task : tasks) {
            double mean = (task.getOptimisticDuration() + 4.0 * task.getMostLikelyDuration()
                    + task.getPessimisticDuration()) / 6.0;
            total += mean * 1000.0;
        }
        return total;
    }

    private double estimateBaseDuration(List<MonteCarloTask> tasks) {
        double total = 0;
        for (MonteCarloTask task : tasks) {
            total += (task.getOptimisticDuration() + 4.0 * task.getMostLikelyDuration()
                    + task.getPessimisticDuration()) / 6.0;
        }
        return Math.max(total, 1.0);
    }

    // ---- TCPI calculations ----

    private BigDecimal calculateTcpiBac(BigDecimal bac, BigDecimal ev, BigDecimal ac) {
        if (bac == null || ev == null || ac == null) {
            return null;
        }
        BigDecimal remainingWork = bac.subtract(ev);
        BigDecimal remainingBudget = bac.subtract(ac);
        if (remainingBudget.compareTo(BigDecimal.ZERO) == 0) {
            return null;
        }
        return remainingWork.divide(remainingBudget, 4, RM);
    }

    private BigDecimal calculateTcpiEac(BigDecimal bac, BigDecimal ev, BigDecimal ac, BigDecimal eac) {
        if (bac == null || ev == null || ac == null || eac == null) {
            return null;
        }
        BigDecimal remainingWork = bac.subtract(ev);
        BigDecimal remainingBudget = eac.subtract(ac);
        if (remainingBudget.compareTo(BigDecimal.ZERO) == 0) {
            return null;
        }
        return remainingWork.divide(remainingBudget, 4, RM);
    }

    // ---- EAC trajectory from historical snapshots ----

    private List<EacTrajectoryPoint> buildEacTrajectory(UUID projectId) {
        List<EvmSnapshot> snapshots = evmSnapshotRepository
                .findByProjectIdAndDeletedFalseOrderBySnapshotDateDesc(projectId);

        List<EacTrajectoryPoint> trajectory = new ArrayList<>();
        // Reverse to chronological order
        for (int i = snapshots.size() - 1; i >= 0; i--) {
            EvmSnapshot snap = snapshots.get(i);
            if (snap.getEac() != null) {
                trajectory.add(new EacTrajectoryPoint(
                        snap.getSnapshotDate().toString(),
                        snap.getEac(),
                        snap.getCpi(),
                        snap.getSpi()
                ));
            }
        }
        return trajectory;
    }

    // ---- Confidence bands ----

    private Map<String, Object> buildConfidenceBands(double[] costSorted, double[] scheduleSorted) {
        int[] percentiles = {5, 10, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90, 95};

        List<Map<String, Object>> costBands = new ArrayList<>();
        List<Map<String, Object>> scheduleBands = new ArrayList<>();

        for (int p : percentiles) {
            Map<String, Object> costBand = new HashMap<>();
            costBand.put("percentile", p);
            costBand.put("value", percentile(costSorted, p));
            costBands.add(costBand);

            Map<String, Object> scheduleBand = new HashMap<>();
            scheduleBand.put("percentile", p);
            scheduleBand.put("value", percentile(scheduleSorted, p));
            scheduleBands.add(scheduleBand);
        }

        Map<String, Object> bands = new HashMap<>();
        bands.put("cost", costBands);
        bands.put("schedule", scheduleBands);
        return bands;
    }

    // ---- Histogram generation ----

    private List<Map<String, Object>> buildHistogram(double[] sorted) {
        if (sorted.length == 0) {
            return List.of();
        }

        double min = sorted[0];
        double max = sorted[sorted.length - 1];
        double range = max - min;

        if (range == 0) {
            Map<String, Object> bin = new HashMap<>();
            bin.put("bin_start", BigDecimal.valueOf(min).setScale(SCALE, RM));
            bin.put("bin_end", BigDecimal.valueOf(max).setScale(SCALE, RM));
            bin.put("count", sorted.length);
            return List.of(bin);
        }

        double binWidth = range / HISTOGRAM_BINS;
        List<Map<String, Object>> bins = new ArrayList<>();
        int[] counts = new int[HISTOGRAM_BINS];

        for (double value : sorted) {
            int binIndex = (int) ((value - min) / binWidth);
            if (binIndex >= HISTOGRAM_BINS) {
                binIndex = HISTOGRAM_BINS - 1;
            }
            counts[binIndex]++;
        }

        for (int i = 0; i < HISTOGRAM_BINS; i++) {
            Map<String, Object> bin = new HashMap<>();
            bin.put("bin_start", BigDecimal.valueOf(min + i * binWidth).setScale(SCALE, RM));
            bin.put("bin_end", BigDecimal.valueOf(min + (i + 1) * binWidth).setScale(SCALE, RM));
            bin.put("count", counts[i]);
            bins.add(bin);
        }

        return bins;
    }

    // ---- Natural language insights ----

    private List<InsightItem> generateInsights(
            BigDecimal costP50, BigDecimal bac,
            Integer scheduleP50, Integer scheduleP10, Integer scheduleP90,
            BigDecimal tcpiBac, BigDecimal cpi, BigDecimal spi,
            List<MonteCarloTask> tasks) {

        List<InsightItem> insights = new ArrayList<>();

        // Budget overrun probability
        if (bac != null && costP50 != null && bac.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal overrunPercent = costP50.subtract(bac)
                    .divide(bac, 4, RM)
                    .multiply(BigDecimal.valueOf(100))
                    .setScale(1, RM);

            if (overrunPercent.compareTo(BigDecimal.ZERO) > 0) {
                insights.add(new InsightItem(
                        "WARNING",
                        String.format("Проект имеет 50%% вероятность превышения бюджета на %.1f%%",
                                overrunPercent.doubleValue()),
                        String.format("Project has a 50%% probability of exceeding budget by %.1f%%",
                                overrunPercent.doubleValue()),
                        "COST"
                ));
            } else {
                insights.add(new InsightItem(
                        "INFO",
                        String.format("Медианная стоимость (P50) на %.1f%% ниже бюджета",
                                overrunPercent.abs().doubleValue()),
                        String.format("Median cost (P50) is %.1f%% below budget",
                                overrunPercent.abs().doubleValue()),
                        "COST"
                ));
            }
        }

        // Schedule forecast
        if (scheduleP50 != null && scheduleP10 != null && scheduleP90 != null) {
            insights.add(new InsightItem(
                    "INFO",
                    String.format("Прогноз завершения: %d дней (диапазон P10-P90: %d-%d дней)",
                            scheduleP50, scheduleP10, scheduleP90),
                    String.format("Completion forecast: %d days (P10-P90 range: %d-%d days)",
                            scheduleP50, scheduleP10, scheduleP90),
                    "SCHEDULE"
            ));
        }

        // TCPI insight
        if (tcpiBac != null) {
            double tcpiValue = tcpiBac.doubleValue();
            String severityRu;
            String severityEn;
            String severity;
            if (tcpiValue > 1.2) {
                severity = "CRITICAL";
                severityRu = "крайне сложно достичь";
                severityEn = "extremely difficult to achieve";
            } else if (tcpiValue > 1.0) {
                severity = "WARNING";
                severityRu = "потребует усилий";
                severityEn = "will require effort";
            } else {
                severity = "INFO";
                severityRu = "допустимо";
                severityEn = "achievable";
            }

            insights.add(new InsightItem(
                    severity,
                    String.format("TCPI = %.4f: %s", tcpiValue, severityRu),
                    String.format("TCPI = %.4f: %s", tcpiValue, severityEn),
                    "TCPI"
            ));
        }

        // CPI insight
        if (cpi != null && cpi.compareTo(BigDecimal.ZERO) > 0) {
            double cpiValue = cpi.doubleValue();
            if (cpiValue < 0.9) {
                insights.add(new InsightItem(
                        "CRITICAL",
                        String.format("CPI = %.4f: значительное превышение затрат", cpiValue),
                        String.format("CPI = %.4f: significant cost overrun", cpiValue),
                        "EVM"
                ));
            } else if (cpiValue < 1.0) {
                insights.add(new InsightItem(
                        "WARNING",
                        String.format("CPI = %.4f: умеренное превышение затрат", cpiValue),
                        String.format("CPI = %.4f: moderate cost overrun", cpiValue),
                        "EVM"
                ));
            }
        }

        // SPI insight
        if (spi != null && spi.compareTo(BigDecimal.ZERO) > 0) {
            double spiValue = spi.doubleValue();
            if (spiValue < 0.9) {
                insights.add(new InsightItem(
                        "CRITICAL",
                        String.format("SPI = %.4f: значительное отставание от графика", spiValue),
                        String.format("SPI = %.4f: significant schedule delay", spiValue),
                        "EVM"
                ));
            } else if (spiValue < 1.0) {
                insights.add(new InsightItem(
                        "WARNING",
                        String.format("SPI = %.4f: умеренное отставание от графика", spiValue),
                        String.format("SPI = %.4f: moderate schedule delay", spiValue),
                        "EVM"
                ));
            }
        }

        // Top risk-contributing tasks (highest variance)
        List<MonteCarloTask> riskTasks = tasks.stream()
                .sorted((a, b) -> {
                    int rangeA = a.getPessimisticDuration() - a.getOptimisticDuration();
                    int rangeB = b.getPessimisticDuration() - b.getOptimisticDuration();
                    return Integer.compare(rangeB, rangeA);
                })
                .limit(3)
                .toList();

        if (!riskTasks.isEmpty()) {
            StringBuilder ruText = new StringBuilder("Задачи с наибольшим разбросом: ");
            StringBuilder enText = new StringBuilder("Tasks with highest variance: ");

            for (int i = 0; i < riskTasks.size(); i++) {
                MonteCarloTask t = riskTasks.get(i);
                int range = t.getPessimisticDuration() - t.getOptimisticDuration();
                if (i > 0) {
                    ruText.append(", ");
                    enText.append(", ");
                }
                ruText.append(String.format("%s (%d дн.)", t.getTaskName(), range));
                enText.append(String.format("%s (%d days)", t.getTaskName(), range));
            }

            insights.add(new InsightItem(
                    "INFO",
                    ruText.toString(),
                    enText.toString(),
                    "RISK"
            ));
        }

        return insights;
    }

    // ---- JSON serialization ----

    private String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            log.error("Ошибка сериализации JSON", e);
            return "[]";
        }
    }
}
