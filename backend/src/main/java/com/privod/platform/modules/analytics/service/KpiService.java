package com.privod.platform.modules.analytics.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.analytics.domain.AggregationType;
import com.privod.platform.modules.analytics.domain.KpiCategory;
import com.privod.platform.modules.analytics.domain.KpiDefinition;
import com.privod.platform.modules.analytics.domain.KpiSnapshot;
import com.privod.platform.modules.analytics.domain.KpiTrend;
import com.privod.platform.modules.analytics.domain.KpiUnit;
import com.privod.platform.modules.analytics.repository.KpiDefinitionRepository;
import com.privod.platform.modules.analytics.repository.KpiSnapshotRepository;
import com.privod.platform.modules.analytics.web.dto.CreateKpiDefinitionRequest;
import com.privod.platform.modules.analytics.web.dto.KpiDashboardItem;
import com.privod.platform.modules.analytics.web.dto.KpiDefinitionResponse;
import com.privod.platform.modules.analytics.web.dto.KpiSnapshotResponse;
import com.privod.platform.modules.analytics.web.dto.TakeSnapshotRequest;
import com.privod.platform.modules.analytics.web.dto.UpdateKpiDefinitionRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class KpiService {

    private final KpiDefinitionRepository kpiRepository;
    private final KpiSnapshotRepository snapshotRepository;
    private final AuditService auditService;

    // --- KPI Definition CRUD ---

    @Transactional(readOnly = true)
    public KpiDefinitionResponse findById(UUID id) {
        KpiDefinition kpi = getKpiOrThrow(id);
        return KpiDefinitionResponse.fromEntity(kpi);
    }

    @Transactional(readOnly = true)
    public Page<KpiDefinitionResponse> findAll(KpiCategory category, Pageable pageable) {
        if (category != null) {
            return kpiRepository.findByCategoryAndDeletedFalse(category, pageable)
                    .map(KpiDefinitionResponse::fromEntity);
        }
        return kpiRepository.findByDeletedFalse(pageable)
                .map(KpiDefinitionResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public List<KpiDefinitionResponse> getActiveKpis() {
        return kpiRepository.findByIsActiveTrueAndDeletedFalse()
                .stream()
                .map(KpiDefinitionResponse::fromEntity)
                .toList();
    }

    @Transactional
    public KpiDefinitionResponse create(CreateKpiDefinitionRequest request) {
        if (kpiRepository.existsByCodeAndDeletedFalse(request.code())) {
            throw new IllegalArgumentException("KPI с кодом '" + request.code() + "' уже существует");
        }

        KpiDefinition kpi = KpiDefinition.builder()
                .code(request.code())
                .name(request.name())
                .description(request.description())
                .category(request.category())
                .dataSource(request.dataSource())
                .aggregationType(request.aggregationType() != null ? request.aggregationType() : AggregationType.COUNT)
                .formula(request.formula())
                .unit(request.unit() != null ? request.unit() : KpiUnit.COUNT)
                .targetValue(request.targetValue())
                .warningThreshold(request.warningThreshold())
                .criticalThreshold(request.criticalThreshold())
                .isActive(request.isActive() == null || request.isActive())
                .build();

        kpi = kpiRepository.save(kpi);
        auditService.logCreate("KpiDefinition", kpi.getId());

        log.info("KPI created: {} - {} ({})", kpi.getCode(), kpi.getName(), kpi.getId());
        return KpiDefinitionResponse.fromEntity(kpi);
    }

    @Transactional
    public KpiDefinitionResponse update(UUID id, UpdateKpiDefinitionRequest request) {
        KpiDefinition kpi = getKpiOrThrow(id);

        if (request.name() != null) {
            kpi.setName(request.name());
        }
        if (request.description() != null) {
            kpi.setDescription(request.description());
        }
        if (request.category() != null) {
            kpi.setCategory(request.category());
        }
        if (request.dataSource() != null) {
            kpi.setDataSource(request.dataSource());
        }
        if (request.aggregationType() != null) {
            kpi.setAggregationType(request.aggregationType());
        }
        if (request.formula() != null) {
            kpi.setFormula(request.formula());
        }
        if (request.unit() != null) {
            kpi.setUnit(request.unit());
        }
        if (request.targetValue() != null) {
            kpi.setTargetValue(request.targetValue());
        }
        if (request.warningThreshold() != null) {
            kpi.setWarningThreshold(request.warningThreshold());
        }
        if (request.criticalThreshold() != null) {
            kpi.setCriticalThreshold(request.criticalThreshold());
        }
        if (request.isActive() != null) {
            kpi.setActive(request.isActive());
        }

        kpi = kpiRepository.save(kpi);
        auditService.logUpdate("KpiDefinition", kpi.getId(), "multiple", null, null);

        log.info("KPI updated: {} ({})", kpi.getCode(), kpi.getId());
        return KpiDefinitionResponse.fromEntity(kpi);
    }

    @Transactional
    public void delete(UUID id) {
        KpiDefinition kpi = getKpiOrThrow(id);
        kpi.softDelete();
        kpiRepository.save(kpi);
        auditService.logDelete("KpiDefinition", id);
        log.info("KPI soft-deleted: {} ({})", kpi.getCode(), id);
    }

    // --- KPI Snapshots ---

    @Transactional
    public KpiSnapshotResponse takeSnapshot(UUID kpiId, TakeSnapshotRequest request) {
        KpiDefinition kpi = getKpiOrThrow(kpiId);

        Optional<KpiSnapshot> previousSnapshot = snapshotRepository.findLatestByKpiId(kpiId);
        KpiTrend trend = calculateTrend(request.value(), previousSnapshot);

        BigDecimal targetValue = request.targetValue() != null ? request.targetValue() : kpi.getTargetValue();

        KpiSnapshot snapshot = KpiSnapshot.builder()
                .kpiId(kpiId)
                .projectId(request.projectId())
                .snapshotDate(request.snapshotDate() != null ? request.snapshotDate() : LocalDate.now())
                .value(request.value())
                .targetValue(targetValue)
                .trend(trend)
                .build();

        snapshot = snapshotRepository.save(snapshot);

        log.info("KPI snapshot taken: kpi={} value={} trend={}", kpi.getCode(), request.value(), trend);
        return KpiSnapshotResponse.fromEntity(snapshot);
    }

    @Transactional(readOnly = true)
    public Page<KpiSnapshotResponse> getKpiHistory(UUID kpiId, Pageable pageable) {
        getKpiOrThrow(kpiId);
        return snapshotRepository.findByKpiIdAndDeletedFalseOrderBySnapshotDateDesc(kpiId, pageable)
                .map(KpiSnapshotResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public List<KpiSnapshotResponse> getKpiHistoryByDateRange(
            UUID kpiId, LocalDate startDate, LocalDate endDate) {
        getKpiOrThrow(kpiId);
        return snapshotRepository
                .findByKpiIdAndSnapshotDateBetweenAndDeletedFalseOrderBySnapshotDateAsc(kpiId, startDate, endDate)
                .stream()
                .map(KpiSnapshotResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<KpiDashboardItem> getKpiDashboard() {
        List<KpiDefinition> activeKpis = kpiRepository.findByIsActiveTrueAndDeletedFalse();

        return activeKpis.stream()
                .map(kpi -> {
                    Optional<KpiSnapshot> latestSnapshot = snapshotRepository.findLatestByKpiId(kpi.getId());

                    BigDecimal currentValue = latestSnapshot.map(KpiSnapshot::getValue).orElse(BigDecimal.ZERO);
                    KpiTrend trend = latestSnapshot.map(KpiSnapshot::getTrend).orElse(KpiTrend.STABLE);
                    LocalDate lastDate = latestSnapshot.map(KpiSnapshot::getSnapshotDate).orElse(null);

                    String healthStatus = calculateHealthStatus(currentValue, kpi);

                    return new KpiDashboardItem(
                            kpi.getId(),
                            kpi.getCode(),
                            kpi.getName(),
                            kpi.getCategory(),
                            kpi.getCategory().getDisplayName(),
                            kpi.getUnit(),
                            kpi.getUnit().getDisplayName(),
                            currentValue,
                            kpi.getTargetValue(),
                            kpi.getWarningThreshold(),
                            kpi.getCriticalThreshold(),
                            trend,
                            trend.getDisplayName(),
                            lastDate,
                            healthStatus
                    );
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public BigDecimal calculateKpi(UUID kpiId) {
        KpiDefinition kpi = getKpiOrThrow(kpiId);
        Optional<KpiSnapshot> latestSnapshot = snapshotRepository.findLatestByKpiId(kpiId);
        return latestSnapshot.map(KpiSnapshot::getValue).orElse(BigDecimal.ZERO);
    }

    private KpiTrend calculateTrend(BigDecimal newValue, Optional<KpiSnapshot> previousSnapshot) {
        if (previousSnapshot.isEmpty()) {
            return KpiTrend.STABLE;
        }
        BigDecimal previousValue = previousSnapshot.get().getValue();
        int comparison = newValue.compareTo(previousValue);
        if (comparison > 0) {
            return KpiTrend.UP;
        } else if (comparison < 0) {
            return KpiTrend.DOWN;
        }
        return KpiTrend.STABLE;
    }

    private String calculateHealthStatus(BigDecimal currentValue, KpiDefinition kpi) {
        if (kpi.getCriticalThreshold() != null && kpi.getWarningThreshold() != null) {
            boolean criticalIsLower = kpi.getCriticalThreshold().compareTo(kpi.getWarningThreshold()) < 0;
            if (criticalIsLower) {
                // Lower is worse (e.g., completion rate): critical < warning < target
                if (currentValue.compareTo(kpi.getCriticalThreshold()) <= 0) {
                    return "CRITICAL";
                } else if (currentValue.compareTo(kpi.getWarningThreshold()) <= 0) {
                    return "WARNING";
                }
                return "HEALTHY";
            } else {
                // Higher is worse (e.g., incident rate): target < warning < critical
                if (currentValue.compareTo(kpi.getCriticalThreshold()) >= 0) {
                    return "CRITICAL";
                } else if (currentValue.compareTo(kpi.getWarningThreshold()) >= 0) {
                    return "WARNING";
                }
                return "HEALTHY";
            }
        }
        return "UNKNOWN";
    }

    private KpiDefinition getKpiOrThrow(UUID id) {
        return kpiRepository.findById(id)
                .filter(k -> !k.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("KPI не найден: " + id));
    }
}
