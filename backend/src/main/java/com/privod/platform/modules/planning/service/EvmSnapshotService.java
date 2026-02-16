package com.privod.platform.modules.planning.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.planning.domain.EvmSnapshot;
import com.privod.platform.modules.planning.repository.EvmSnapshotRepository;
import com.privod.platform.modules.planning.web.dto.CreateEvmSnapshotRequest;
import com.privod.platform.modules.planning.web.dto.EvmSnapshotResponse;
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
