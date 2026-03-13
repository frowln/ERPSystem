package com.privod.platform.modules.accounting.service;

import com.privod.platform.modules.accounting.domain.AllocationType;
import com.privod.platform.modules.accounting.domain.CostAllocation;
import com.privod.platform.modules.accounting.domain.CostCenter;
import com.privod.platform.modules.accounting.repository.CostAllocationRepository;
import com.privod.platform.modules.accounting.repository.CostCenterRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * P1-FIN-2: Cost allocation by project, department (cost center), and overhead pool.
 *
 * <p>Three allocation methods:
 * <ul>
 *   <li>DIRECT: costs charged directly to one cost center without splitting.</li>
 *   <li>PROPORTIONAL: overhead pool amount split across targets by their share percentages;
 *       if no percentages provided, equal split is used.</li>
 *   <li>FIXED: a specific fixed amount assigned per target cost center.</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CostAllocationService {

    private final CostAllocationRepository allocationRepository;
    private final CostCenterRepository costCenterRepository;

    @Transactional(readOnly = true)
    public Page<CostAllocation> listForCostCenter(UUID costCenterId, Pageable pageable) {
        requireCostCenterExists(costCenterId);
        return allocationRepository.findByCostCenterIdAndDeletedFalse(costCenterId, pageable);
    }

    @Transactional(readOnly = true)
    public List<CostAllocation> listForPeriod(UUID periodId) {
        return allocationRepository.findByPeriodIdAndDeletedFalse(periodId);
    }

    @Transactional(readOnly = true)
    public BigDecimal sumForCostCenterAndPeriod(UUID costCenterId, UUID periodId) {
        return allocationRepository.sumByCostCenterAndPeriod(costCenterId, periodId);
    }

    /**
     * DIRECT allocation: records a cost against a single cost center.
     */
    @Transactional
    public CostAllocation allocateDirect(UUID costCenterId, UUID periodId,
                                         UUID accountId, BigDecimal amount) {
        requireCostCenterExists(costCenterId);
        CostAllocation allocation = CostAllocation.builder()
                .costCenterId(costCenterId)
                .periodId(periodId)
                .accountId(accountId)
                .amount(amount)
                .allocationType(AllocationType.DIRECT)
                .build();
        allocation = allocationRepository.save(allocation);
        log.info("Direct allocation created: costCenter={}, period={}, amount={}", costCenterId, periodId, amount);
        return allocation;
    }

    /**
     * PROPORTIONAL allocation: distributes totalAmount across targetCostCenterIds.
     * If sharePercents is null or empty, uses equal split.
     * sharePercents must sum to ~100 if provided.
     *
     * @param sourceCostCenterId Pool/overhead cost center to allocate FROM
     * @param targetCostCenterIds Target cost centers to receive the allocation
     * @param sharePercents       Optional — share for each target (0–100). Equal split if null.
     */
    @Transactional
    public List<CostAllocation> allocateProportional(UUID sourceCostCenterId,
                                                      UUID periodId,
                                                      UUID accountId,
                                                      BigDecimal totalAmount,
                                                      List<UUID> targetCostCenterIds,
                                                      List<BigDecimal> sharePercents) {
        if (targetCostCenterIds == null || targetCostCenterIds.isEmpty()) {
            throw new IllegalArgumentException("Необходимо указать хотя бы один целевой центр затрат");
        }

        int n = targetCostCenterIds.size();
        List<BigDecimal> percents;

        if (sharePercents != null && sharePercents.size() == n) {
            percents = sharePercents;
        } else {
            // Equal split
            BigDecimal equalShare = new BigDecimal("100").divide(BigDecimal.valueOf(n), 6, RoundingMode.HALF_UP);
            percents = new ArrayList<>();
            for (int i = 0; i < n; i++) percents.add(equalShare);
        }

        List<CostAllocation> allocations = new ArrayList<>();
        BigDecimal allocated = BigDecimal.ZERO;

        for (int i = 0; i < n; i++) {
            UUID targetId = targetCostCenterIds.get(i);
            BigDecimal share = percents.get(i);

            BigDecimal allocationAmount;
            if (i == n - 1) {
                // Last target gets the remainder to avoid rounding loss
                allocationAmount = totalAmount.subtract(allocated).setScale(2, RoundingMode.HALF_UP);
            } else {
                allocationAmount = totalAmount.multiply(share)
                        .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
                allocated = allocated.add(allocationAmount);
            }

            CostAllocation allocation = CostAllocation.builder()
                    .costCenterId(targetId)
                    .periodId(periodId)
                    .accountId(accountId)
                    .amount(allocationAmount)
                    .allocationType(AllocationType.PROPORTIONAL)
                    .build();
            allocations.add(allocationRepository.save(allocation));
        }

        log.info("Proportional allocation: source={}, targets={}, totalAmount={}, {} allocations created",
                sourceCostCenterId, n, totalAmount, allocations.size());
        return allocations;
    }

    /**
     * Returns cost centers for a specific project.
     */
    @Transactional(readOnly = true)
    public List<CostCenter> listCostCentersByProject(UUID projectId) {
        return costCenterRepository.findByProjectIdAndDeletedFalse(projectId);
    }

    private void requireCostCenterExists(UUID costCenterId) {
        if (!costCenterRepository.existsById(costCenterId)) {
            throw new EntityNotFoundException("Центр затрат не найден: " + costCenterId);
        }
    }
}
