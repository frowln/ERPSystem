package com.privod.platform.modules.revenueRecognition.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.revenueRecognition.domain.PeriodStatus;
import com.privod.platform.modules.revenueRecognition.domain.RevenueContract;
import com.privod.platform.modules.revenueRecognition.domain.RevenueRecognitionPeriod;
import com.privod.platform.modules.revenueRecognition.repository.RevenueRecognitionPeriodRepository;
import com.privod.platform.modules.revenueRecognition.web.dto.CalculatePeriodRequest;
import com.privod.platform.modules.revenueRecognition.web.dto.ChangePeriodStatusRequest;
import com.privod.platform.modules.revenueRecognition.web.dto.CreateRecognitionPeriodRequest;
import com.privod.platform.modules.revenueRecognition.web.dto.RevenueRecognitionPeriodResponse;
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
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class RevenueRecognitionPeriodService {

    private final RevenueRecognitionPeriodRepository periodRepository;
    private final RevenueContractService revenueContractService;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<RevenueRecognitionPeriodResponse> listPeriods(UUID revenueContractId, Pageable pageable) {
        return periodRepository
                .findByRevenueContractIdAndDeletedFalseOrderByPeriodStartDesc(revenueContractId, pageable)
                .map(RevenueRecognitionPeriodResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public RevenueRecognitionPeriodResponse getPeriod(UUID id) {
        RevenueRecognitionPeriod period = getPeriodOrThrow(id);
        return RevenueRecognitionPeriodResponse.fromEntity(period);
    }

    @Transactional
    public RevenueRecognitionPeriodResponse createPeriod(CreateRecognitionPeriodRequest request) {
        RevenueContract contract = revenueContractService.getContractOrThrow(request.revenueContractId());

        if (request.periodEnd().isBefore(request.periodStart())) {
            throw new IllegalArgumentException(
                    "Дата окончания периода должна быть позже даты начала");
        }

        // Check for overlapping periods
        periodRepository.findByRevenueContractIdAndPeriodStartAndPeriodEndAndDeletedFalse(
                request.revenueContractId(), request.periodStart(), request.periodEnd()
        ).ifPresent(existing -> {
            throw new IllegalStateException(
                    "Период с такими датами уже существует для данного договора");
        });

        RevenueRecognitionPeriod period = RevenueRecognitionPeriod.builder()
                .revenueContractId(request.revenueContractId())
                .periodStart(request.periodStart())
                .periodEnd(request.periodEnd())
                .cumulativeCostIncurred(request.cumulativeCostIncurred())
                .notes(request.notes())
                .build();

        period = periodRepository.save(period);
        auditService.logCreate("RevenueRecognitionPeriod", period.getId());

        log.info("RevenueRecognitionPeriod created: {} - {} for contract {}",
                period.getPeriodStart(), period.getPeriodEnd(), period.getRevenueContractId());
        return RevenueRecognitionPeriodResponse.fromEntity(period);
    }

    /**
     * Рассчитывает выручку по методу процента завершения (ПБУ 2/2008).
     *
     * Формула: Revenue = TotalContractRevenue * (CumulativeCost / TotalEstimatedCost)
     * Period Revenue = CumulativeRevenue(current) - CumulativeRevenue(previous)
     *
     * Если totalEstimatedCost > totalContractRevenue, ожидаемый убыток признаётся немедленно.
     */
    @Transactional
    public RevenueRecognitionPeriodResponse calculatePeriod(UUID periodId,
                                                             CalculatePeriodRequest request) {
        RevenueRecognitionPeriod period = getPeriodOrThrow(periodId);

        if (period.getStatus() != PeriodStatus.OPEN && period.getStatus() != PeriodStatus.CALCULATED) {
            throw new IllegalStateException(
                    "Расчёт возможен только для периодов в статусе Открыт или Рассчитан");
        }

        RevenueContract contract = revenueContractService.getContractOrThrow(period.getRevenueContractId());

        BigDecimal cumulativeCost = request.cumulativeCostIncurred();
        BigDecimal totalEstimatedCost = contract.getTotalEstimatedCost();
        BigDecimal totalContractRevenue = contract.getTotalContractRevenue();

        // Percent complete = cumulativeCost / totalEstimatedCost * 100
        BigDecimal percentComplete = cumulativeCost
                .multiply(new BigDecimal("100"))
                .divide(totalEstimatedCost, 4, RoundingMode.HALF_UP);

        // Cap at 100%
        if (percentComplete.compareTo(new BigDecimal("100")) > 0) {
            percentComplete = new BigDecimal("100.0000");
        }

        // Cumulative revenue = totalContractRevenue * (cumulativeCost / totalEstimatedCost)
        BigDecimal cumulativeRevenue = totalContractRevenue
                .multiply(cumulativeCost)
                .divide(totalEstimatedCost, 2, RoundingMode.HALF_UP);

        // Find previous period to compute period-specific revenue
        BigDecimal previousCumulativeRevenue = BigDecimal.ZERO;
        BigDecimal previousCumulativeCost = BigDecimal.ZERO;

        var previousPeriodOpt = periodRepository.findPreviousPeriod(
                period.getRevenueContractId(), period.getPeriodStart());
        if (previousPeriodOpt.isPresent()) {
            RevenueRecognitionPeriod prev = previousPeriodOpt.get();
            previousCumulativeRevenue = prev.getCumulativeRevenueRecognized() != null
                    ? prev.getCumulativeRevenueRecognized() : BigDecimal.ZERO;
            previousCumulativeCost = prev.getCumulativeCostIncurred() != null
                    ? prev.getCumulativeCostIncurred() : BigDecimal.ZERO;
        }

        BigDecimal periodRevenue = cumulativeRevenue.subtract(previousCumulativeRevenue);
        BigDecimal periodCost = cumulativeCost.subtract(previousCumulativeCost);
        BigDecimal estimateCostToComplete = totalEstimatedCost.subtract(cumulativeCost);

        if (estimateCostToComplete.compareTo(BigDecimal.ZERO) < 0) {
            estimateCostToComplete = BigDecimal.ZERO;
        }

        // Loss provision: if totalEstimatedCost > totalContractRevenue, recognize expected loss immediately
        BigDecimal expectedLoss = BigDecimal.ZERO;
        BigDecimal expectedProfit = BigDecimal.ZERO;

        if (contract.isLossContract()) {
            expectedLoss = totalEstimatedCost.subtract(totalContractRevenue);
        } else {
            expectedProfit = totalContractRevenue.subtract(totalEstimatedCost);
        }

        // Update period
        period.setCumulativeCostIncurred(cumulativeCost);
        period.setCumulativeRevenueRecognized(cumulativeRevenue);
        period.setPeriodCostIncurred(periodCost);
        period.setPeriodRevenueRecognized(periodRevenue);
        period.setPercentComplete(percentComplete);
        period.setEstimateCostToComplete(estimateCostToComplete);
        period.setExpectedProfit(expectedProfit);
        period.setExpectedLoss(expectedLoss);
        period.setCalculatedById(request.calculatedById());
        period.setStatus(PeriodStatus.CALCULATED);

        period = periodRepository.save(period);
        auditService.logStatusChange("RevenueRecognitionPeriod", period.getId(),
                PeriodStatus.OPEN.name(), PeriodStatus.CALCULATED.name());

        log.info("RevenueRecognitionPeriod calculated: {} percent complete={}, revenue={}",
                period.getId(), percentComplete, periodRevenue);
        return RevenueRecognitionPeriodResponse.fromEntity(period);
    }

    @Transactional
    public RevenueRecognitionPeriodResponse changeStatus(UUID periodId,
                                                          ChangePeriodStatusRequest request) {
        RevenueRecognitionPeriod period = getPeriodOrThrow(periodId);
        PeriodStatus oldStatus = period.getStatus();
        PeriodStatus newStatus = request.status();

        if (!period.canTransitionTo(newStatus)) {
            throw new IllegalStateException(
                    String.format("Невозможно перевести период из статуса %s в %s",
                            oldStatus.getDisplayName(), newStatus.getDisplayName()));
        }

        period.setStatus(newStatus);

        if (newStatus == PeriodStatus.REVIEWED && request.userId() != null) {
            period.setReviewedById(request.userId());
        }
        if (newStatus == PeriodStatus.POSTED) {
            period.setPostedById(request.userId());
            period.setPostedAt(Instant.now());
        }

        period = periodRepository.save(period);
        auditService.logStatusChange("RevenueRecognitionPeriod", period.getId(),
                oldStatus.name(), newStatus.name());

        log.info("RevenueRecognitionPeriod status changed: {} from {} to {}",
                period.getId(), oldStatus, newStatus);
        return RevenueRecognitionPeriodResponse.fromEntity(period);
    }

    @Transactional
    public void deletePeriod(UUID id) {
        RevenueRecognitionPeriod period = getPeriodOrThrow(id);

        if (period.getStatus() == PeriodStatus.POSTED || period.getStatus() == PeriodStatus.CLOSED) {
            throw new IllegalStateException(
                    "Невозможно удалить период в статусе Проведён или Закрыт");
        }

        period.softDelete();
        periodRepository.save(period);
        auditService.logDelete("RevenueRecognitionPeriod", id);
        log.info("RevenueRecognitionPeriod soft-deleted: {}", id);
    }

    RevenueRecognitionPeriod getPeriodOrThrow(UUID id) {
        return periodRepository.findById(id)
                .filter(p -> !p.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Период признания выручки не найден: " + id));
    }
}
