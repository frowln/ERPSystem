package com.privod.platform.modules.costManagement.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.costManagement.domain.CashFlowProjection;
import com.privod.platform.modules.costManagement.repository.CashFlowProjectionRepository;
import com.privod.platform.modules.costManagement.web.dto.CashFlowProjectionResponse;
import com.privod.platform.modules.costManagement.web.dto.CreateCashFlowProjectionRequest;
import com.privod.platform.modules.costManagement.web.dto.UpdateCashFlowProjectionRequest;
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
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CashFlowProjectionService {

    private final CashFlowProjectionRepository cashFlowProjectionRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<CashFlowProjectionResponse> listByProject(UUID projectId, Pageable pageable) {
        return cashFlowProjectionRepository.findByProjectIdAndDeletedFalse(projectId, pageable)
                .map(CashFlowProjectionResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public CashFlowProjectionResponse getById(UUID id) {
        CashFlowProjection projection = getProjectionOrThrow(id);
        return CashFlowProjectionResponse.fromEntity(projection);
    }

    @Transactional(readOnly = true)
    public List<CashFlowProjectionResponse> listByDateRange(UUID projectId, LocalDate startDate, LocalDate endDate) {
        return cashFlowProjectionRepository.findByProjectIdAndDateRange(projectId, startDate, endDate)
                .stream()
                .map(CashFlowProjectionResponse::fromEntity)
                .toList();
    }

    @Transactional
    public CashFlowProjectionResponse create(CreateCashFlowProjectionRequest request) {
        validatePeriod(request.periodStart(), request.periodEnd());

        CashFlowProjection projection = CashFlowProjection.builder()
                .projectId(request.projectId())
                .periodStart(request.periodStart())
                .periodEnd(request.periodEnd())
                .plannedIncome(request.plannedIncome() != null ? request.plannedIncome() : BigDecimal.ZERO)
                .plannedExpense(request.plannedExpense() != null ? request.plannedExpense() : BigDecimal.ZERO)
                .actualIncome(request.actualIncome() != null ? request.actualIncome() : BigDecimal.ZERO)
                .actualExpense(request.actualExpense() != null ? request.actualExpense() : BigDecimal.ZERO)
                .forecastIncome(request.forecastIncome() != null ? request.forecastIncome() : BigDecimal.ZERO)
                .forecastExpense(request.forecastExpense() != null ? request.forecastExpense() : BigDecimal.ZERO)
                .notes(request.notes())
                .build();

        recalculateCumulatives(projection);

        projection = cashFlowProjectionRepository.save(projection);
        auditService.logCreate("CashFlowProjection", projection.getId());

        log.info("Cash flow projection created for project {} period {}-{} ({})",
                projection.getProjectId(), projection.getPeriodStart(), projection.getPeriodEnd(), projection.getId());
        return CashFlowProjectionResponse.fromEntity(projection);
    }

    @Transactional
    public CashFlowProjectionResponse update(UUID id, UpdateCashFlowProjectionRequest request) {
        CashFlowProjection projection = getProjectionOrThrow(id);

        if (request.periodStart() != null) {
            projection.setPeriodStart(request.periodStart());
        }
        if (request.periodEnd() != null) {
            projection.setPeriodEnd(request.periodEnd());
        }
        validatePeriod(projection.getPeriodStart(), projection.getPeriodEnd());

        if (request.plannedIncome() != null) {
            projection.setPlannedIncome(request.plannedIncome());
        }
        if (request.plannedExpense() != null) {
            projection.setPlannedExpense(request.plannedExpense());
        }
        if (request.actualIncome() != null) {
            projection.setActualIncome(request.actualIncome());
        }
        if (request.actualExpense() != null) {
            projection.setActualExpense(request.actualExpense());
        }
        if (request.forecastIncome() != null) {
            projection.setForecastIncome(request.forecastIncome());
        }
        if (request.forecastExpense() != null) {
            projection.setForecastExpense(request.forecastExpense());
        }
        if (request.notes() != null) {
            projection.setNotes(request.notes());
        }

        recalculateCumulatives(projection);

        projection = cashFlowProjectionRepository.save(projection);
        auditService.logUpdate("CashFlowProjection", projection.getId(), "multiple", null, null);

        log.info("Cash flow projection updated: {}", projection.getId());
        return CashFlowProjectionResponse.fromEntity(projection);
    }

    @Transactional
    public void delete(UUID id) {
        CashFlowProjection projection = getProjectionOrThrow(id);
        projection.softDelete();
        cashFlowProjectionRepository.save(projection);
        auditService.logDelete("CashFlowProjection", id);

        log.info("Cash flow projection deleted: {}", id);
    }

    private void recalculateCumulatives(CashFlowProjection projection) {
        projection.setCumulativePlannedNet(projection.getPlannedNet());
        projection.setCumulativeActualNet(projection.getActualNet());
    }

    private void validatePeriod(LocalDate start, LocalDate end) {
        if (start != null && end != null && end.isBefore(start)) {
            throw new IllegalArgumentException("Дата окончания периода должна быть позже даты начала");
        }
    }

    private CashFlowProjection getProjectionOrThrow(UUID id) {
        return cashFlowProjectionRepository.findById(id)
                .filter(p -> !p.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Проекция денежного потока не найдена: " + id));
    }
}
