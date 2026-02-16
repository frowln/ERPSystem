package com.privod.platform.modules.costManagement.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.costManagement.domain.CostForecast;
import com.privod.platform.modules.costManagement.domain.ForecastMethod;
import com.privod.platform.modules.costManagement.repository.CostForecastRepository;
import com.privod.platform.modules.costManagement.web.dto.CostForecastResponse;
import com.privod.platform.modules.costManagement.web.dto.CreateCostForecastRequest;
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
public class CostForecastService {

    private final CostForecastRepository costForecastRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<CostForecastResponse> listByProject(UUID projectId, Pageable pageable) {
        return costForecastRepository.findByProjectIdAndDeletedFalse(projectId, pageable)
                .map(CostForecastResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public CostForecastResponse getById(UUID id) {
        CostForecast forecast = getForecastOrThrow(id);
        return CostForecastResponse.fromEntity(forecast);
    }

    @Transactional(readOnly = true)
    public CostForecastResponse getLatest(UUID projectId) {
        CostForecast forecast = costForecastRepository
                .findFirstByProjectIdAndDeletedFalseOrderByForecastDateDesc(projectId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Прогноз затрат не найден для проекта: " + projectId));
        return CostForecastResponse.fromEntity(forecast);
    }

    @Transactional(readOnly = true)
    public List<CostForecastResponse> listByDateRange(UUID projectId, LocalDate startDate, LocalDate endDate) {
        return costForecastRepository.findByProjectIdAndDateRange(projectId, startDate, endDate)
                .stream()
                .map(CostForecastResponse::fromEntity)
                .toList();
    }

    @Transactional
    public CostForecastResponse create(CreateCostForecastRequest request) {
        CostForecast forecast = CostForecast.builder()
                .projectId(request.projectId())
                .forecastDate(request.forecastDate())
                .forecastMethod(request.forecastMethod() != null ? request.forecastMethod() : ForecastMethod.MANUAL)
                .budgetAtCompletion(request.budgetAtCompletion())
                .earnedValue(request.earnedValue())
                .plannedValue(request.plannedValue())
                .actualCost(request.actualCost())
                .percentComplete(request.percentComplete())
                .notes(request.notes())
                .createdById(request.createdById())
                .build();

        forecast.calculateEvmIndicators();

        forecast = costForecastRepository.save(forecast);
        auditService.logCreate("CostForecast", forecast.getId());

        log.info("Cost forecast created for project {} on date {} ({})",
                forecast.getProjectId(), forecast.getForecastDate(), forecast.getId());
        return CostForecastResponse.fromEntity(forecast);
    }

    /**
     * Create a snapshot of the current EVM state for the project.
     */
    @Transactional
    public CostForecastResponse createSnapshot(UUID projectId, BigDecimal bac, BigDecimal ev,
                                                BigDecimal pv, BigDecimal ac,
                                                BigDecimal percentComplete, String notes) {
        CostForecast snapshot = CostForecast.builder()
                .projectId(projectId)
                .forecastDate(LocalDate.now())
                .forecastMethod(ForecastMethod.EARNED_VALUE)
                .budgetAtCompletion(bac)
                .earnedValue(ev)
                .plannedValue(pv)
                .actualCost(ac)
                .percentComplete(percentComplete)
                .notes(notes)
                .build();

        snapshot.calculateEvmIndicators();

        snapshot = costForecastRepository.save(snapshot);
        auditService.logCreate("CostForecast", snapshot.getId());

        log.info("EVM snapshot created for project {}: CPI={}, SPI={} ({})",
                projectId, snapshot.getCostPerformanceIndex(),
                snapshot.getSchedulePerformanceIndex(), snapshot.getId());
        return CostForecastResponse.fromEntity(snapshot);
    }

    @Transactional
    public CostForecastResponse update(UUID id, CreateCostForecastRequest request) {
        CostForecast forecast = getForecastOrThrow(id);

        if (request.forecastDate() != null) forecast.setForecastDate(request.forecastDate());
        if (request.forecastMethod() != null) forecast.setForecastMethod(request.forecastMethod());
        if (request.budgetAtCompletion() != null) forecast.setBudgetAtCompletion(request.budgetAtCompletion());
        if (request.earnedValue() != null) forecast.setEarnedValue(request.earnedValue());
        if (request.plannedValue() != null) forecast.setPlannedValue(request.plannedValue());
        if (request.actualCost() != null) forecast.setActualCost(request.actualCost());
        if (request.percentComplete() != null) forecast.setPercentComplete(request.percentComplete());
        if (request.notes() != null) forecast.setNotes(request.notes());

        forecast.calculateEvmIndicators();

        forecast = costForecastRepository.save(forecast);
        auditService.logUpdate("CostForecast", forecast.getId(), "multiple", null, null);

        log.info("Cost forecast updated for project {} ({})",
                forecast.getProjectId(), forecast.getId());
        return CostForecastResponse.fromEntity(forecast);
    }

    @Transactional
    public void delete(UUID id) {
        CostForecast forecast = getForecastOrThrow(id);
        forecast.softDelete();
        costForecastRepository.save(forecast);
        auditService.logDelete("CostForecast", id);

        log.info("Cost forecast deleted: {}", id);
    }

    private CostForecast getForecastOrThrow(UUID id) {
        return costForecastRepository.findById(id)
                .filter(f -> !f.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Прогноз затрат не найден: " + id));
    }
}
