package com.privod.platform.modules.planning.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.finance.domain.PaymentType;
import com.privod.platform.modules.finance.repository.BudgetRepository;
import com.privod.platform.modules.finance.repository.PaymentRepository;
import com.privod.platform.modules.planning.domain.EvmSnapshot;
import com.privod.platform.modules.planning.repository.EvmSnapshotRepository;
import com.privod.platform.modules.planning.web.dto.CreateEvmSnapshotRequest;
import com.privod.platform.modules.planning.web.dto.EvmSnapshotResponse;
import com.privod.platform.modules.task.repository.ProjectTaskRepository;
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
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class EvmSnapshotService {

    private final EvmSnapshotRepository evmSnapshotRepository;
    private final AuditService auditService;
    private final BudgetRepository budgetRepository;
    private final PaymentRepository paymentRepository;
    private final ProjectTaskRepository projectTaskRepository;

    @Transactional(readOnly = true)
    public Page<EvmSnapshotResponse> findByProject(UUID projectId, Pageable pageable) {
        if (projectId == null) {
            return evmSnapshotRepository.findByDeletedFalse(pageable)
                    .map(EvmSnapshotResponse::fromEntity);
        }
        return evmSnapshotRepository.findByProjectIdAndDeletedFalse(projectId, pageable)
                .map(EvmSnapshotResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public EvmSnapshotResponse findById(UUID id) {
        EvmSnapshot snapshot = getSnapshotOrThrow(id);
        return EvmSnapshotResponse.fromEntity(snapshot);
    }

    @Transactional(readOnly = true)
    public Optional<EvmSnapshotResponse> findLatest(UUID projectId) {
        return evmSnapshotRepository.findLatestByProjectId(projectId)
                .map(EvmSnapshotResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public List<EvmSnapshotResponse> findByDateRange(UUID projectId, LocalDate from, LocalDate to) {
        return evmSnapshotRepository.findByProjectIdAndSnapshotDateBetweenAndDeletedFalseOrderBySnapshotDate(
                        projectId, from, to)
                .stream()
                .map(EvmSnapshotResponse::fromEntity)
                .toList();
    }

    @Transactional
    public EvmSnapshotResponse create(CreateEvmSnapshotRequest request) {
        EvmSnapshot snapshot = EvmSnapshot.builder()
                .projectId(request.projectId())
                .snapshotDate(request.snapshotDate())
                .dataDate(request.dataDate())
                .budgetAtCompletion(request.budgetAtCompletion())
                .plannedValue(request.plannedValue())
                .earnedValue(request.earnedValue())
                .actualCost(request.actualCost())
                .percentComplete(request.percentComplete())
                .criticalPathLength(request.criticalPathLength())
                .notes(request.notes())
                .build();

        calculateEvmMetrics(snapshot);

        snapshot = evmSnapshotRepository.save(snapshot);
        auditService.logCreate("EvmSnapshot", snapshot.getId());

        log.info("EVM снимок создан: {} для проекта {} ({})",
                snapshot.getSnapshotDate(), snapshot.getProjectId(), snapshot.getId());
        return EvmSnapshotResponse.fromEntity(snapshot);
    }

    /**
     * P0-CHN-6: Автоматически создаёт EVM снимок из реальных данных проекта.
     * <ul>
     *   <li>BAC = сумма plannedCost всех бюджетов проекта</li>
     *   <li>AC  = сумма OUTGOING платежей со статусом PAID</li>
     *   <li>EV  = avg(task.progress) / 100 * BAC (средневзвешенный прогресс задач)</li>
     *   <li>PV  = BAC (текущий плановый объём равен BAC до реального расписания WBS)</li>
     * </ul>
     */
    @Transactional
    public EvmSnapshotResponse autoSnapshot(UUID projectId, UUID organizationId) {
        // 1. Budget At Completion — сумма плановых затрат по проекту
        BigDecimal bac = budgetRepository.sumPlannedCostByProjectId(projectId);
        if (bac == null) {
            bac = BigDecimal.ZERO;
        }

        // 2. Actual Cost — фактические исходящие платежи (PAID)
        BigDecimal actualCost = paymentRepository.sumTotalByProjectIdAndType(projectId, PaymentType.OUTGOING);
        if (actualCost == null) {
            actualCost = BigDecimal.ZERO;
        }

        // 3. Earned Value — средний прогресс задач проекта × BAC
        List<com.privod.platform.modules.task.domain.ProjectTask> tasks =
                projectTaskRepository.findByProjectIdAndDeletedFalseOrderByWbsCodeAscSortOrderAsc(projectId);
        BigDecimal avgProgress = BigDecimal.ZERO;
        if (!tasks.isEmpty()) {
            int totalProgress = tasks.stream()
                    .mapToInt(t -> t.getProgress() != null ? t.getProgress() : 0)
                    .sum();
            avgProgress = new BigDecimal(totalProgress)
                    .divide(new BigDecimal(tasks.size()), 4, RoundingMode.HALF_UP)
                    .divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP);
        }
        BigDecimal earnedValue = bac.multiply(avgProgress).setScale(2, RoundingMode.HALF_UP);

        // 4. Planned Value — используем BAC как упрощение (без реального WBS расписания)
        BigDecimal plannedValue = bac;

        // 5. Percent complete
        BigDecimal percentComplete = avgProgress.multiply(new BigDecimal("100")).setScale(2, RoundingMode.HALF_UP);

        EvmSnapshot snapshot = EvmSnapshot.builder()
                .projectId(projectId)
                .snapshotDate(LocalDate.now())
                .dataDate(LocalDate.now())
                .budgetAtCompletion(bac)
                .plannedValue(plannedValue)
                .earnedValue(earnedValue)
                .actualCost(actualCost)
                .percentComplete(percentComplete)
                .notes("Авто-снимок из реальных данных задач и платежей")
                .build();

        calculateEvmMetrics(snapshot);

        snapshot = evmSnapshotRepository.save(snapshot);
        auditService.logCreate("EvmSnapshot", snapshot.getId());

        log.info("EVM авто-снимок создан: проект={} BAC={} EV={} AC={} прогресс={}%",
                projectId, bac, earnedValue, actualCost, percentComplete);
        return EvmSnapshotResponse.fromEntity(snapshot);
    }

    @Transactional
    public void delete(UUID id) {
        EvmSnapshot snapshot = getSnapshotOrThrow(id);
        snapshot.softDelete();
        evmSnapshotRepository.save(snapshot);
        auditService.logDelete("EvmSnapshot", id);
        log.info("EVM снимок удалён: {}", id);
    }

    /**
     * Вычисляет производные показатели EVM: CPI, SPI, EAC, ETC, TCPI.
     */
    void calculateEvmMetrics(EvmSnapshot snapshot) {
        BigDecimal ev = snapshot.getEarnedValue();
        BigDecimal ac = snapshot.getActualCost();
        BigDecimal pv = snapshot.getPlannedValue();
        BigDecimal bac = snapshot.getBudgetAtCompletion();

        if (ev != null && ac != null && ac.compareTo(BigDecimal.ZERO) != 0) {
            snapshot.setCpi(ev.divide(ac, 4, RoundingMode.HALF_UP));
        }

        if (ev != null && pv != null && pv.compareTo(BigDecimal.ZERO) != 0) {
            snapshot.setSpi(ev.divide(pv, 4, RoundingMode.HALF_UP));
        }

        if (bac != null && snapshot.getCpi() != null && snapshot.getCpi().compareTo(BigDecimal.ZERO) != 0) {
            snapshot.setEac(bac.divide(snapshot.getCpi(), 2, RoundingMode.HALF_UP));
        }

        if (snapshot.getEac() != null && ac != null) {
            snapshot.setEtcValue(snapshot.getEac().subtract(ac));
        }

        if (bac != null && ev != null && ac != null) {
            BigDecimal remainingWork = bac.subtract(ev);
            BigDecimal remainingBudget = bac.subtract(ac);
            if (remainingBudget.compareTo(BigDecimal.ZERO) != 0) {
                snapshot.setTcpi(remainingWork.divide(remainingBudget, 4, RoundingMode.HALF_UP));
            }
        }
    }

    private EvmSnapshot getSnapshotOrThrow(UUID id) {
        return evmSnapshotRepository.findById(id)
                .filter(s -> !s.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("EVM снимок не найден: " + id));
    }
}
