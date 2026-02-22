package com.privod.platform.modules.planning.service;

import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.planning.domain.EvmSnapshot;
import com.privod.platform.modules.planning.domain.WbsNode;
import com.privod.platform.modules.planning.repository.EvmSnapshotRepository;
import com.privod.platform.modules.planning.repository.WbsNodeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
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

    // ── Helpers ─────────────────────────────────────────────────────────

    private static BigDecimal safe(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private static boolean isPositive(BigDecimal value) {
        return value != null && value.compareTo(BigDecimal.ZERO) > 0;
    }
}
