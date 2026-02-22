package com.privod.platform.modules.costManagement.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.costManagement.domain.ProfitabilityForecast;
import com.privod.platform.modules.costManagement.domain.ProfitabilityRiskLevel;
import com.privod.platform.modules.costManagement.domain.ProfitabilitySnapshot;
import com.privod.platform.modules.costManagement.repository.ProfitabilityForecastRepository;
import com.privod.platform.modules.costManagement.repository.ProfitabilitySnapshotRepository;
import com.privod.platform.modules.costManagement.web.dto.ProfitabilityForecastResponse;
import com.privod.platform.modules.costManagement.web.dto.ProfitabilityPortfolioResponse;
import com.privod.platform.modules.costManagement.web.dto.ProfitabilitySnapshotResponse;
import com.privod.platform.modules.planning.domain.EvmSnapshot;
import com.privod.platform.modules.planning.repository.EvmSnapshotRepository;
import com.privod.platform.modules.project.domain.Project;
import com.privod.platform.modules.project.repository.ProjectRepository;
import com.privod.platform.modules.project.service.ProjectFinancialService;
import com.privod.platform.modules.project.web.dto.ProjectFinancialSummary;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Service for profitability forecasting (P3-11).
 * Calculates EAC, ETC, forecast margins, profit fade, WIP, and billing analysis
 * for individual projects and the full portfolio.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ProfitabilityForecastService {

    private final ProfitabilityForecastRepository forecastRepository;
    private final ProfitabilitySnapshotRepository snapshotRepository;
    private final ProjectFinancialService projectFinancialService;
    private final ProjectRepository projectRepository;
    private final EvmSnapshotRepository evmSnapshotRepository;
    private final AuditService auditService;

    private static final BigDecimal HUNDRED = new BigDecimal("100");
    private static final BigDecimal PROFIT_FADE_HIGH_THRESHOLD = new BigDecimal("20");
    private static final BigDecimal PROFIT_FADE_MEDIUM_THRESHOLD = new BigDecimal("10");

    // ─── Read Operations ───────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<ProfitabilityForecastResponse> findAll(Pageable pageable) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        return forecastRepository.findByOrganizationIdAndDeletedFalse(orgId, pageable)
                .map(ProfitabilityForecastResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public ProfitabilityForecastResponse findByProject(UUID projectId) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        ProfitabilityForecast forecast = forecastRepository
                .findByOrganizationIdAndProjectIdAndDeletedFalse(orgId, projectId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Profitability forecast not found for project: " + projectId));
        return ProfitabilityForecastResponse.fromEntity(forecast);
    }

    @Transactional(readOnly = true)
    public Page<ProfitabilityForecastResponse> findByRiskLevel(ProfitabilityRiskLevel riskLevel, Pageable pageable) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        return forecastRepository
                .findByOrganizationIdAndRiskLevelAndDeletedFalse(orgId, riskLevel, pageable)
                .map(ProfitabilityForecastResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public List<ProfitabilitySnapshotResponse> getSnapshots(UUID projectId) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        return snapshotRepository
                .findByOrganizationIdAndProjectIdAndDeletedFalseOrderBySnapshotDateAsc(orgId, projectId)
                .stream()
                .map(ProfitabilitySnapshotResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProfitabilityPortfolioResponse getPortfolioSummary() {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        List<ProfitabilityForecast> forecasts = forecastRepository.findAllByOrganizationIdAndDeletedFalse(orgId);

        if (forecasts.isEmpty()) {
            return new ProfitabilityPortfolioResponse(
                    0, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                    BigDecimal.ZERO, 0, 0, Map.of());
        }

        BigDecimal totalContractValue = BigDecimal.ZERO;
        BigDecimal totalForecastMargin = BigDecimal.ZERO;
        BigDecimal totalProfitFade = BigDecimal.ZERO;
        int projectsAtRisk = 0;
        int lossProjects = 0;
        Map<String, Integer> byRiskLevel = new HashMap<>();

        for (ProfitabilityForecast f : forecasts) {
            totalContractValue = totalContractValue.add(safeValue(f.getContractAmount()));
            totalForecastMargin = totalForecastMargin.add(safeValue(f.getForecastMargin()));
            totalProfitFade = totalProfitFade.add(safeValue(f.getProfitFadeAmount()));

            ProfitabilityRiskLevel risk = f.getRiskLevel();
            if (risk == ProfitabilityRiskLevel.HIGH || risk == ProfitabilityRiskLevel.CRITICAL) {
                projectsAtRisk++;
            }
            if (safeValue(f.getForecastMargin()).compareTo(BigDecimal.ZERO) < 0) {
                lossProjects++;
            }

            String riskName = risk != null ? risk.name() : "LOW";
            byRiskLevel.merge(riskName, 1, Integer::sum);
        }

        BigDecimal avgMarginPercent = totalContractValue.compareTo(BigDecimal.ZERO) != 0
                ? totalForecastMargin.divide(totalContractValue, 4, RoundingMode.HALF_UP).multiply(HUNDRED)
                : BigDecimal.ZERO;

        return new ProfitabilityPortfolioResponse(
                forecasts.size(),
                totalContractValue,
                totalForecastMargin,
                avgMarginPercent,
                totalProfitFade,
                projectsAtRisk,
                lossProjects,
                byRiskLevel
        );
    }

    // ─── Recalculation ────────────────────────────────────────────────

    @Transactional
    public ProfitabilityForecastResponse recalculate(UUID projectId) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        // Validate project exists and belongs to the org
        Project project = projectRepository.findByIdAndOrganizationIdAndDeletedFalse(projectId, orgId)
                .orElseThrow(() -> new EntityNotFoundException("Project not found: " + projectId));

        // Get financial data
        ProjectFinancialSummary financials = projectFinancialService.getFinancials(projectId);

        // Get latest EVM snapshot for CPI
        Optional<EvmSnapshot> latestEvm = evmSnapshotRepository.findLatestByProjectId(projectId);

        // Core financial values
        BigDecimal contractAmount = safeValue(financials.contractAmount());
        BigDecimal plannedBudget = safeValue(financials.plannedBudget());
        BigDecimal actualCost = safeValue(financials.actualCost());
        BigDecimal earnedValue = latestEvm.map(e -> safeValue(e.getEarnedValue())).orElse(BigDecimal.ZERO);
        BigDecimal completionPercent = safeValue(financials.completionPercent());
        BigDecimal invoicedToCustomer = safeValue(financials.invoicedToCustomer());

        // Budget values
        BigDecimal originalBudget = plannedBudget;
        // Use estimate total as revised budget if available, otherwise fall back to planned budget
        BigDecimal revisedBudget = safeValue(financials.estimateTotal()).compareTo(BigDecimal.ZERO) > 0
                ? financials.estimateTotal()
                : plannedBudget;

        // EAC calculation: if CPI available from EVM, use BAC/CPI; otherwise use revisedBudget
        BigDecimal eac;
        if (latestEvm.isPresent() && latestEvm.get().getCpi() != null
                && latestEvm.get().getCpi().compareTo(BigDecimal.ZERO) > 0
                && latestEvm.get().getBudgetAtCompletion() != null) {
            BigDecimal bac = latestEvm.get().getBudgetAtCompletion();
            BigDecimal cpi = latestEvm.get().getCpi();
            eac = bac.divide(cpi, 2, RoundingMode.HALF_UP);
        } else {
            eac = revisedBudget;
        }

        // ETC = EAC - actualCost
        BigDecimal etc = eac.subtract(actualCost).max(BigDecimal.ZERO);

        // Margin calculations
        BigDecimal forecastMargin = contractAmount.subtract(eac);
        BigDecimal forecastMarginPercent = contractAmount.compareTo(BigDecimal.ZERO) != 0
                ? forecastMargin.divide(contractAmount, 4, RoundingMode.HALF_UP).multiply(HUNDRED)
                : BigDecimal.ZERO;

        BigDecimal originalMargin = contractAmount.subtract(originalBudget);
        BigDecimal profitFadeAmount = originalMargin.subtract(forecastMargin);
        BigDecimal profitFadePercent = originalMargin.compareTo(BigDecimal.ZERO) != 0
                ? profitFadeAmount.divide(originalMargin.abs(), 4, RoundingMode.HALF_UP).multiply(HUNDRED)
                : BigDecimal.ZERO;

        // WIP = actualCostToDate - (contractAmount * completionPercent / 100)
        BigDecimal revenueRecognized = contractAmount.multiply(completionPercent)
                .divide(HUNDRED, 2, RoundingMode.HALF_UP);
        BigDecimal wipAmount = actualCost.subtract(revenueRecognized);

        // Billing analysis (simplified: invoicedToCustomer vs earnedValue)
        BigDecimal billingDiff = invoicedToCustomer.subtract(earnedValue);
        BigDecimal overBillingAmount = billingDiff.max(BigDecimal.ZERO);
        BigDecimal underBillingAmount = billingDiff.negate().max(BigDecimal.ZERO);

        // Risk level determination
        ProfitabilityRiskLevel riskLevel = determineRiskLevel(forecastMargin, profitFadePercent);

        // Create or update forecast
        ProfitabilityForecast forecast = forecastRepository
                .findByOrganizationIdAndProjectIdAndDeletedFalse(orgId, projectId)
                .orElse(ProfitabilityForecast.builder()
                        .organizationId(orgId)
                        .projectId(projectId)
                        .build());

        boolean isNew = forecast.getId() == null;

        forecast.setProjectName(project.getName());
        forecast.setContractAmount(contractAmount);
        forecast.setOriginalBudget(originalBudget);
        forecast.setRevisedBudget(revisedBudget);
        forecast.setActualCostToDate(actualCost);
        forecast.setEarnedValueToDate(earnedValue);
        forecast.setEstimateAtCompletion(eac);
        forecast.setEstimateToComplete(etc);
        forecast.setForecastMargin(forecastMargin);
        forecast.setForecastMarginPercent(forecastMarginPercent);
        forecast.setOriginalMargin(originalMargin);
        forecast.setProfitFadeAmount(profitFadeAmount);
        forecast.setProfitFadePercent(profitFadePercent);
        forecast.setWipAmount(wipAmount);
        forecast.setOverBillingAmount(overBillingAmount);
        forecast.setUnderBillingAmount(underBillingAmount);
        forecast.setCompletionPercent(completionPercent);
        forecast.setRiskLevel(riskLevel);
        forecast.setLastCalculatedAt(LocalDateTime.now());

        forecast = forecastRepository.save(forecast);

        if (isNew) {
            auditService.logCreate("ProfitabilityForecast", forecast.getId());
        } else {
            auditService.logUpdate("ProfitabilityForecast", forecast.getId(), "recalculation", null, null);
        }

        // Create snapshot for time-series tracking
        ProfitabilitySnapshot snapshot = ProfitabilitySnapshot.builder()
                .organizationId(orgId)
                .projectId(projectId)
                .forecastId(forecast.getId())
                .snapshotDate(LocalDate.now())
                .eac(eac)
                .etc(etc)
                .actualCost(actualCost)
                .earnedValue(earnedValue)
                .forecastMargin(forecastMargin)
                .forecastMarginPercent(forecastMarginPercent)
                .wipAmount(wipAmount)
                .profitFadeAmount(profitFadeAmount)
                .completionPercent(completionPercent)
                .build();
        snapshotRepository.save(snapshot);

        log.info("Recalculated profitability forecast for project {} [{}]: margin={}, risk={}",
                project.getName(), projectId, forecastMargin, riskLevel);

        return ProfitabilityForecastResponse.fromEntity(forecast);
    }

    @Transactional
    public void recalculateAll() {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        List<UUID> activeProjectIds = projectRepository.findActiveProjectIdsByOrganizationId(orgId);

        log.info("Recalculating profitability forecasts for {} active projects in org {}",
                activeProjectIds.size(), orgId);

        int success = 0;
        int failed = 0;
        for (UUID projectId : activeProjectIds) {
            try {
                recalculate(projectId);
                success++;
            } catch (Exception e) {
                failed++;
                log.warn("Failed to recalculate profitability for project {}: {}", projectId, e.getMessage());
            }
        }

        log.info("Profitability recalculation complete: {} succeeded, {} failed", success, failed);
    }

    // ─── Delete ───────────────────────────────────────────────────────

    @Transactional
    public void deleteForProject(UUID projectId) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        ProfitabilityForecast forecast = forecastRepository
                .findByOrganizationIdAndProjectIdAndDeletedFalse(orgId, projectId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Profitability forecast not found for project: " + projectId));

        forecast.softDelete();
        forecastRepository.save(forecast);
        auditService.logDelete("ProfitabilityForecast", forecast.getId());

        log.info("Soft-deleted profitability forecast for project {}", projectId);
    }

    // ─── Private Helpers ──────────────────────────────────────────────

    private ProfitabilityRiskLevel determineRiskLevel(BigDecimal forecastMargin, BigDecimal profitFadePercent) {
        if (forecastMargin.compareTo(BigDecimal.ZERO) < 0) {
            return ProfitabilityRiskLevel.CRITICAL;
        }
        if (profitFadePercent.abs().compareTo(PROFIT_FADE_HIGH_THRESHOLD) > 0) {
            return ProfitabilityRiskLevel.HIGH;
        }
        if (profitFadePercent.abs().compareTo(PROFIT_FADE_MEDIUM_THRESHOLD) > 0) {
            return ProfitabilityRiskLevel.MEDIUM;
        }
        return ProfitabilityRiskLevel.LOW;
    }

    private BigDecimal safeValue(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }
}
