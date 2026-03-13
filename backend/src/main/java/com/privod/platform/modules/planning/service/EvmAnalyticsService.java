package com.privod.platform.modules.planning.service;

import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.finance.domain.Budget;
import com.privod.platform.modules.finance.repository.BudgetItemRepository;
import com.privod.platform.modules.finance.repository.BudgetRepository;
import com.privod.platform.modules.planning.domain.EvmSnapshot;
import com.privod.platform.modules.planning.domain.WbsNode;
import com.privod.platform.modules.planning.repository.EvmSnapshotRepository;
import com.privod.platform.modules.planning.repository.WbsNodeRepository;
import com.privod.platform.modules.task.domain.TaskStatus;
import com.privod.platform.modules.task.repository.ProjectTaskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Analytical service that provides advanced EVM (Earned Value Management)
 * calculations for the P3-12 EVM Dashboard enhancements.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EvmAnalyticsService {

    private static final int SCALE = 4;

    private final EvmSnapshotRepository evmSnapshotRepository;
    private final WbsNodeRepository wbsNodeRepository;
    private final ProjectTaskRepository projectTaskRepository; // P0-6: EVM из реальных задач
    private final BudgetRepository budgetRepository;           // P0-6: BAC из бюджета
    private final BudgetItemRepository budgetItemRepository;   // P0-6: sumPlannedAmount

    // ── Inner records ───────────────────────────────────────────────────

    public record EvmTrendPoint(
            String snapshotDate,
            BigDecimal pv,
            BigDecimal ev,
            BigDecimal ac,
            BigDecimal cpi,
            BigDecimal spi,
            BigDecimal eac,
            BigDecimal percentComplete
    ) {}

    public record EacMethodsResponse(
            BigDecimal bac,
            BigDecimal eacCpi,
            BigDecimal eacSpiCpi,
            BigDecimal eacBottom,
            BigDecimal ieac,
            BigDecimal vac,
            BigDecimal tcpiEac,
            BigDecimal tcpiBac,
            BigDecimal cpi,
            BigDecimal spi,
            BigDecimal ev,
            BigDecimal ac,
            BigDecimal pv,
            BigDecimal percentComplete
    ) {}

    public record WbsEvmRow(
            UUID wbsId,
            String code,
            String name,
            Integer level,
            BigDecimal bac,
            BigDecimal pv,
            BigDecimal ev,
            BigDecimal ac,
            BigDecimal sv,
            BigDecimal cv,
            BigDecimal percentComplete
    ) {}

    public record ConfidenceBandPoint(
            String period,
            BigDecimal pv,
            BigDecimal ev,
            BigDecimal ac,
            BigDecimal optimisticEv,
            BigDecimal pessimisticEv
    ) {}

    // ── Public API ──────────────────────────────────────────────────────

    /**
     * Returns the EVM S-curve trend: one point per snapshot ordered by date ascending.
     */
    @Transactional(readOnly = true)
    public List<EvmTrendPoint> getEvmTrend(UUID projectId) {
        SecurityUtils.requireCurrentOrganizationId();

        List<EvmSnapshot> snapshots =
                evmSnapshotRepository.findByProjectIdAndDeletedFalseOrderBySnapshotDateDesc(projectId);

        // Reverse to ascending order for chronological trend display
        List<EvmSnapshot> ascending = snapshots.stream()
                .sorted(Comparator.comparing(EvmSnapshot::getSnapshotDate))
                .collect(Collectors.toList());

        return ascending.stream()
                .map(s -> new EvmTrendPoint(
                        s.getSnapshotDate().toString(),
                        safe(s.getPlannedValue()),
                        safe(s.getEarnedValue()),
                        safe(s.getActualCost()),
                        safe(s.getCpi()),
                        safe(s.getSpi()),
                        safe(s.getEac()),
                        safe(s.getPercentComplete())
                ))
                .collect(Collectors.toList());
    }

    /**
     * Calculates multiple EAC forecasting methods from the latest snapshot.
     */
    @Transactional(readOnly = true)
    public EacMethodsResponse getEacMethods(UUID projectId) {
        SecurityUtils.requireCurrentOrganizationId();

        EvmSnapshot latest = evmSnapshotRepository.findLatestByProjectId(projectId)
                .orElseThrow(() -> new IllegalStateException(
                        "No EVM snapshots found for project " + projectId));

        BigDecimal bac = safe(latest.getBudgetAtCompletion());
        BigDecimal ev  = safe(latest.getEarnedValue());
        BigDecimal ac  = safe(latest.getActualCost());
        BigDecimal pv  = safe(latest.getPlannedValue());
        BigDecimal cpi = safe(latest.getCpi());
        BigDecimal spi = safe(latest.getSpi());
        BigDecimal percentComplete = safe(latest.getPercentComplete());

        // --- EAC Method 1: EAC based on CPI (typical) ---
        // EAC_cpi = BAC / CPI
        BigDecimal eacCpi = isPositive(cpi)
                ? bac.divide(cpi, SCALE, RoundingMode.HALF_UP)
                : bac;

        // --- EAC Method 2: EAC based on SPI * CPI ---
        // EAC_spi_cpi = AC + (BAC - EV) / (CPI * SPI)
        BigDecimal cpiSpi = cpi.multiply(spi);
        BigDecimal eacSpiCpi = isPositive(cpiSpi)
                ? ac.add(bac.subtract(ev).divide(cpiSpi, SCALE, RoundingMode.HALF_UP))
                : bac;

        // --- EAC Method 3: Bottom-up / managerial estimate ---
        // For now, uses BAC as the managerial estimate placeholder
        BigDecimal eacBottom = bac;

        // --- EAC Method 4: Independent EAC ---
        // IEAC = AC + (BAC - EV)  (assumes original estimates for remaining work)
        BigDecimal ieac = ac.add(bac.subtract(ev));

        // --- Variance at Completion ---
        // VAC = BAC - EAC (using eacCpi)
        BigDecimal vac = bac.subtract(eacCpi);

        // --- TCPI based on EAC ---
        // TCPI_eac = (BAC - EV) / (EAC - AC)
        BigDecimal eacMinusAc = eacCpi.subtract(ac);
        BigDecimal tcpiEac = isPositive(eacMinusAc)
                ? bac.subtract(ev).divide(eacMinusAc, SCALE, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // --- TCPI based on BAC ---
        // TCPI_bac = (BAC - EV) / (BAC - AC)
        BigDecimal bacMinusAc = bac.subtract(ac);
        BigDecimal tcpiBac = isPositive(bacMinusAc)
                ? bac.subtract(ev).divide(bacMinusAc, SCALE, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        log.debug("EAC methods calculated for project {}: eacCpi={}, eacSpiCpi={}, ieac={}",
                projectId, eacCpi, eacSpiCpi, ieac);

        return new EacMethodsResponse(
                bac, eacCpi, eacSpiCpi, eacBottom, ieac,
                vac, tcpiEac, tcpiBac,
                cpi, spi, ev, ac, pv, percentComplete
        );
    }

    /**
     * Returns an EVM breakdown per WBS node using planned volume as budget proxy.
     */
    @Transactional(readOnly = true)
    public List<WbsEvmRow> getWbsEvmBreakdown(UUID projectId) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        List<WbsNode> nodes =
                wbsNodeRepository.findByProjectIdAndDeletedFalseOrderBySortOrder(projectId);

        // Filter to current organization in case the repository does not scope by org
        return nodes.stream()
                .filter(n -> orgId.equals(n.getOrganizationId()))
                .map(node -> {
                    BigDecimal bac = safe(node.getPlannedVolume());
                    BigDecimal pct = safe(node.getPercentComplete());
                    // EV = BAC * percentComplete / 100
                    BigDecimal ev = bac.multiply(pct)
                            .divide(BigDecimal.valueOf(100), SCALE, RoundingMode.HALF_UP);
                    // PV = plannedVolume (used as proxy for planned value)
                    BigDecimal pv = bac;
                    // AC: WbsNode has no actualCost field; derive as ev for now
                    BigDecimal ac = ev;
                    // SV = EV - PV
                    BigDecimal sv = ev.subtract(pv);
                    // CV = EV - AC
                    BigDecimal cv = ev.subtract(ac);

                    return new WbsEvmRow(
                            node.getId(),
                            node.getCode(),
                            node.getName(),
                            node.getLevel(),
                            bac,
                            pv,
                            ev,
                            ac,
                            sv,
                            cv,
                            pct
                    );
                })
                .collect(Collectors.toList());
    }

    /**
     * Returns EVM trend data augmented with optimistic/pessimistic confidence bands.
     */
    @Transactional(readOnly = true)
    public List<ConfidenceBandPoint> getConfidenceBands(UUID projectId) {
        List<EvmTrendPoint> trend = getEvmTrend(projectId);

        return trend.stream()
                .map(pt -> {
                    BigDecimal optimisticEv = pt.ev()
                            .multiply(BigDecimal.valueOf(1.1))
                            .setScale(SCALE, RoundingMode.HALF_UP);
                    BigDecimal pessimisticEv = pt.ev()
                            .multiply(BigDecimal.valueOf(0.9))
                            .setScale(SCALE, RoundingMode.HALF_UP);

                    return new ConfidenceBandPoint(
                            pt.snapshotDate(),
                            pt.pv(),
                            pt.ev(),
                            pt.ac(),
                            optimisticEv,
                            pessimisticEv
                    );
                })
                .collect(Collectors.toList());
    }

    /**
     * P0-6: Пересчёт EVM-снимка из реальных операционных данных (Задачи + Бюджет).
     * Устраняет разрыв «EVM ↛ Task/WorkOrder» — EV теперь вычисляется из факта задач.
     *
     * Алгоритм:
     *   1. % выполнения = DONE / (TOTAL - CANCELLED) × 100  (из статусов задач)
     *   2. BAC = сумма плановых бюджетных позиций проекта
     *   3. EV = BAC × (% выполнения / 100)
     *   4. PV = EV (упрощение — без календарного базового плана в данный момент)
     *   5. AC = 0 (фактические затраты из счетов/платежей пока не интегрированы)
     *   6. Создать/обновить EvmSnapshot на текущую дату
     */
    @Transactional
    public EvmSnapshot refreshEvmSnapshotFromTasks(UUID projectId) {
        SecurityUtils.requireCurrentOrganizationId();

        // Step 1: Агрегация статусов задач
        List<Object[]> statusCounts = projectTaskRepository.countByStatusAndProjectId(projectId);
        long total = 0, done = 0, cancelled = 0;
        for (Object[] row : statusCounts) {
            TaskStatus status = (TaskStatus) row[0];
            long count = ((Number) row[1]).longValue();
            total += count;
            if (TaskStatus.DONE == status) done += count;
            if (TaskStatus.CANCELLED == status) cancelled += count;
        }
        long effective = total - cancelled;
        BigDecimal percentComplete = effective > 0
                ? BigDecimal.valueOf(done * 100.0 / effective).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // Step 2: BAC = Σ плановых сумм бюджетных позиций проекта
        List<Budget> budgets = budgetRepository.findByProjectIdAndDeletedFalseOrderByCreatedAtDesc(projectId);
        BigDecimal bac = BigDecimal.ZERO;
        if (!budgets.isEmpty()) {
            List<UUID> budgetIds = budgets.stream().map(Budget::getId).collect(Collectors.toList());
            BigDecimal planned = budgetItemRepository.sumPlannedAmountByBudgetIds(budgetIds);
            if (planned != null) bac = planned;
        }

        // Step 3: EV = BAC × % complete / 100
        BigDecimal hundred = BigDecimal.valueOf(100);
        BigDecimal ev = bac.multiply(percentComplete).divide(hundred, 2, RoundingMode.HALF_UP);
        BigDecimal pv = ev; // упрощение: без базового календарного плана PV ≈ EV
        BigDecimal ac = BigDecimal.ZERO; // AC из платежей/счетов: будет интегрировано в Phase 5

        // Step 4: Индексы
        BigDecimal cpi = isPositive(ac) ? ev.divide(ac, SCALE, RoundingMode.HALF_UP) : BigDecimal.ONE;
        BigDecimal spi = isPositive(pv) ? ev.divide(pv, SCALE, RoundingMode.HALF_UP) : BigDecimal.ONE;
        BigDecimal eac = isPositive(cpi) ? bac.divide(cpi, 2, RoundingMode.HALF_UP) : bac;

        // Step 5: Upsert EvmSnapshot на сегодня
        LocalDate today = LocalDate.now();
        EvmSnapshot snapshot = evmSnapshotRepository
                .findByProjectIdAndSnapshotDateAndDeletedFalse(projectId, today)
                .orElseGet(() -> EvmSnapshot.builder().projectId(projectId).snapshotDate(today).build());

        snapshot.setBudgetAtCompletion(bac);
        snapshot.setPlannedValue(pv);
        snapshot.setEarnedValue(ev);
        snapshot.setActualCost(ac);
        snapshot.setCpi(cpi);
        snapshot.setSpi(spi);
        snapshot.setEac(eac);
        snapshot.setPercentComplete(percentComplete);
        snapshot.setDataDate(today);
        snapshot.setNotes("Авторасчёт из задач: " + done + "/" + effective + " завершено");

        EvmSnapshot saved = evmSnapshotRepository.save(snapshot);
        log.info("EVM-снимок обновлён из задач: projectId={}, %={}, ev={}, bac={}",
                projectId, percentComplete, ev, bac);
        return saved;
    }

    // ── Helpers ─────────────────────────────────────────────────────────

    private static BigDecimal safe(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private static boolean isPositive(BigDecimal value) {
        return value != null && value.compareTo(BigDecimal.ZERO) > 0;
    }
}
