package com.privod.platform.modules.costManagement.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.costManagement.domain.CashFlowForecastBucket;
import com.privod.platform.modules.costManagement.domain.CashFlowScenario;
import com.privod.platform.modules.costManagement.repository.CashFlowForecastBucketRepository;
import com.privod.platform.modules.costManagement.repository.CashFlowScenarioRepository;
import com.privod.platform.modules.costManagement.web.dto.CashFlowForecastBucketResponse;
import com.privod.platform.modules.costManagement.web.dto.CashFlowScenarioResponse;
import com.privod.platform.modules.costManagement.web.dto.CreateCashFlowScenarioRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CashFlowForecastEnhancedService {

    private final CashFlowScenarioRepository scenarioRepository;
    private final CashFlowForecastBucketRepository bucketRepository;
    private final AuditService auditService;

    private static final BigDecimal BASE_MONTHLY_INCOME = new BigDecimal("1000000.00");
    private static final BigDecimal BASE_MONTHLY_EXPENSE = new BigDecimal("800000.00");
    private static final BigDecimal ONE_HUNDRED = new BigDecimal("100");

    // --- Inner record for variance summary ---
    public record VarianceSummary(
            BigDecimal totalForecastNet,
            BigDecimal totalActualNet,
            BigDecimal totalVariance,
            BigDecimal avgMonthlyVariance
    ) {
    }

    // --- Scenario CRUD ---

    @Transactional(readOnly = true)
    public Page<CashFlowScenarioResponse> findAllScenarios(Pageable pageable) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        return scenarioRepository.findByOrganizationIdAndDeletedFalse(orgId, pageable)
                .map(CashFlowScenarioResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public CashFlowScenarioResponse findScenarioById(UUID id) {
        CashFlowScenario scenario = getScenarioOrThrow(id);
        return CashFlowScenarioResponse.fromEntity(scenario);
    }

    @Transactional(readOnly = true)
    public List<CashFlowScenarioResponse> findScenariosByProject(UUID projectId) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        List<CashFlowScenario> scenarios;
        if (projectId == null) {
            scenarios = scenarioRepository.findByOrganizationIdAndProjectIdIsNullAndDeletedFalse(orgId);
        } else {
            scenarios = scenarioRepository.findByOrganizationIdAndProjectIdAndDeletedFalse(orgId, projectId);
        }
        return scenarios.stream()
                .map(CashFlowScenarioResponse::fromEntity)
                .toList();
    }

    @Transactional
    public CashFlowScenarioResponse createScenario(CreateCashFlowScenarioRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        CashFlowScenario scenario = CashFlowScenario.builder()
                .organizationId(orgId)
                .projectId(request.projectId())
                .name(request.name())
                .description(request.description())
                .baselineDate(request.baselineDate() != null ? request.baselineDate() : LocalDate.now())
                .horizonMonths(request.horizonMonths() != null ? request.horizonMonths() : 12)
                .growthRatePercent(request.growthRatePercent() != null ? request.growthRatePercent() : BigDecimal.ZERO)
                .paymentDelayDays(request.paymentDelayDays() != null ? request.paymentDelayDays() : 30)
                .retentionPercent(request.retentionPercent() != null ? request.retentionPercent() : BigDecimal.ZERO)
                .includeVat(request.includeVat() != null ? request.includeVat() : true)
                .build();

        scenario = scenarioRepository.save(scenario);
        auditService.logCreate("CashFlowScenario", scenario.getId());

        log.info("Cash flow scenario created: {} ({})", scenario.getName(), scenario.getId());
        return CashFlowScenarioResponse.fromEntity(scenario);
    }

    @Transactional
    public CashFlowScenarioResponse updateScenario(UUID id, CreateCashFlowScenarioRequest request) {
        CashFlowScenario scenario = getScenarioOrThrow(id);

        if (request.name() != null) {
            scenario.setName(request.name());
        }
        if (request.description() != null) {
            scenario.setDescription(request.description());
        }
        if (request.projectId() != null) {
            scenario.setProjectId(request.projectId());
        }
        if (request.baselineDate() != null) {
            scenario.setBaselineDate(request.baselineDate());
        }
        if (request.horizonMonths() != null) {
            scenario.setHorizonMonths(request.horizonMonths());
        }
        if (request.growthRatePercent() != null) {
            scenario.setGrowthRatePercent(request.growthRatePercent());
        }
        if (request.paymentDelayDays() != null) {
            scenario.setPaymentDelayDays(request.paymentDelayDays());
        }
        if (request.retentionPercent() != null) {
            scenario.setRetentionPercent(request.retentionPercent());
        }
        if (request.includeVat() != null) {
            scenario.setIncludeVat(request.includeVat());
        }

        scenario = scenarioRepository.save(scenario);
        auditService.logUpdate("CashFlowScenario", scenario.getId(), "multiple", null, null);

        log.info("Cash flow scenario updated: {} ({})", scenario.getName(), scenario.getId());
        return CashFlowScenarioResponse.fromEntity(scenario);
    }

    @Transactional
    public void deleteScenario(UUID id) {
        CashFlowScenario scenario = getScenarioOrThrow(id);
        scenario.softDelete();
        scenarioRepository.save(scenario);
        auditService.logDelete("CashFlowScenario", id);

        log.info("Cash flow scenario deleted: {} ({})", scenario.getName(), id);
    }

    // --- Forecast generation ---

    @Transactional
    public List<CashFlowForecastBucketResponse> generateForecast(UUID scenarioId) {
        CashFlowScenario scenario = getScenarioOrThrow(scenarioId);
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        // Remove existing buckets for this scenario before regenerating
        bucketRepository.deleteByScenarioIdAndDeletedFalse(scenarioId);

        LocalDate baselineDate = scenario.getBaselineDate() != null ? scenario.getBaselineDate() : LocalDate.now();
        int horizonMonths = scenario.getHorizonMonths();
        BigDecimal growthRate = scenario.getGrowthRatePercent();
        BigDecimal retentionPct = scenario.getRetentionPercent();

        List<CashFlowForecastBucket> buckets = new ArrayList<>();
        BigDecimal cumulativeForecastNet = BigDecimal.ZERO;
        BigDecimal cumulativeActualNet = BigDecimal.ZERO;

        for (int month = 0; month < horizonMonths; month++) {
            LocalDate periodStart = baselineDate.plusMonths(month).withDayOfMonth(1);
            LocalDate periodEnd = periodStart.plusMonths(1).minusDays(1);

            // forecastIncome = baseIncome * (1 + growthRate/100) ^ month
            BigDecimal growthMultiplier = BigDecimal.ONE
                    .add(growthRate.divide(ONE_HUNDRED, 10, RoundingMode.HALF_UP))
                    .pow(month, MathContext.DECIMAL128);
            BigDecimal forecastIncome = BASE_MONTHLY_INCOME
                    .multiply(growthMultiplier)
                    .setScale(2, RoundingMode.HALF_UP);

            // forecastExpense = baseExpense - (baseExpense * retentionPercent / 100)
            BigDecimal retentionAmount = BASE_MONTHLY_EXPENSE
                    .multiply(retentionPct)
                    .divide(ONE_HUNDRED, 2, RoundingMode.HALF_UP);
            BigDecimal forecastExpense = BASE_MONTHLY_EXPENSE
                    .subtract(retentionAmount)
                    .setScale(2, RoundingMode.HALF_UP);

            BigDecimal forecastNet = forecastIncome.subtract(forecastExpense);

            cumulativeForecastNet = cumulativeForecastNet.add(forecastNet);

            CashFlowForecastBucket bucket = CashFlowForecastBucket.builder()
                    .organizationId(orgId)
                    .scenarioId(scenarioId)
                    .projectId(scenario.getProjectId())
                    .periodStart(periodStart)
                    .periodEnd(periodEnd)
                    .forecastIncome(forecastIncome)
                    .forecastExpense(forecastExpense)
                    .forecastNet(forecastNet)
                    .actualIncome(BigDecimal.ZERO)
                    .actualExpense(BigDecimal.ZERO)
                    .actualNet(BigDecimal.ZERO)
                    .variance(forecastNet)
                    .cumulativeForecastNet(cumulativeForecastNet)
                    .cumulativeActualNet(cumulativeActualNet)
                    .build();

            buckets.add(bucket);
        }

        List<CashFlowForecastBucket> saved = bucketRepository.saveAll(buckets);
        auditService.logCreate("CashFlowForecast", scenarioId);

        log.info("Generated {} forecast buckets for scenario {}", saved.size(), scenarioId);
        return saved.stream()
                .map(CashFlowForecastBucketResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CashFlowForecastBucketResponse> getForecastBuckets(UUID scenarioId) {
        getScenarioOrThrow(scenarioId);
        return bucketRepository.findByScenarioIdAndDeletedFalseOrderByPeriodStart(scenarioId)
                .stream()
                .map(CashFlowForecastBucketResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public VarianceSummary getVarianceSummary(UUID scenarioId) {
        getScenarioOrThrow(scenarioId);
        List<CashFlowForecastBucket> buckets =
                bucketRepository.findByScenarioIdAndDeletedFalseOrderByPeriodStart(scenarioId);

        BigDecimal totalForecastNet = BigDecimal.ZERO;
        BigDecimal totalActualNet = BigDecimal.ZERO;
        BigDecimal totalVariance = BigDecimal.ZERO;

        for (CashFlowForecastBucket bucket : buckets) {
            totalForecastNet = totalForecastNet.add(bucket.getForecastNet());
            totalActualNet = totalActualNet.add(bucket.getActualNet());
            totalVariance = totalVariance.add(bucket.getVariance());
        }

        BigDecimal avgMonthlyVariance = buckets.isEmpty()
                ? BigDecimal.ZERO
                : totalVariance.divide(BigDecimal.valueOf(buckets.size()), 2, RoundingMode.HALF_UP);

        return new VarianceSummary(totalForecastNet, totalActualNet, totalVariance, avgMonthlyVariance);
    }

    // --- Private helpers ---

    private CashFlowScenario getScenarioOrThrow(UUID id) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        return scenarioRepository.findById(id)
                .filter(s -> !s.isDeleted())
                .filter(s -> s.getOrganizationId().equals(orgId))
                .orElseThrow(() -> new EntityNotFoundException("Сценарий денежного потока не найден: " + id));
    }
}
