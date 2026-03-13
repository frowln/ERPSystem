package com.privod.platform.infrastructure.scheduler.jobs;

import com.privod.platform.modules.accounting.domain.FixedAsset;
import com.privod.platform.modules.accounting.domain.FixedAssetStatus;
import com.privod.platform.modules.accounting.repository.FixedAssetRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * P1-FIN-1: Monthly depreciation charge for all active fixed assets.
 *
 * <p>Runs on the 1st day of each month at 01:00 (server time).
 * For every {@link FixedAsset} in {@code ACTIVE} status with a positive
 * {@code usefulLifeMonths}:
 * <ol>
 *   <li>Calculates the monthly depreciation amount using the asset's configured
 *       method (LINEAR / REDUCING_BALANCE / SUM_OF_YEARS).</li>
 *   <li>Subtracts the amount from {@code currentValue} (book value).</li>
 *   <li>If {@code currentValue} drops to zero or below, the asset is fully
 *       depreciated: {@code currentValue} is clamped to zero and the status
 *       transitions to {@code DISPOSED}.</li>
 * </ol>
 *
 * <p>The number of months elapsed is derived from the purchase date so that
 * methods such as SUM_OF_YEARS produce accurate results.
 */
@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(prefix = "app.scheduler", name = "enabled", havingValue = "true", matchIfMissing = true)
public class RecurringDepreciationJob {

    private final FixedAssetRepository fixedAssetRepository;

    /**
     * Runs on the 1st of every month at 01:00.
     * Cron: second minute hour day-of-month month day-of-week
     */
    @Scheduled(cron = "0 0 1 1 * *")
    @Transactional
    public void applyMonthlyDepreciation() {
        long start = System.currentTimeMillis();
        log.info("[RecurringDepreciationJob] START - Applying monthly depreciation to active fixed assets");

        AtomicInteger charged = new AtomicInteger();
        AtomicInteger fullyDepreciated = new AtomicInteger();
        AtomicInteger skipped = new AtomicInteger();

        try {
            // Load all ACTIVE fixed assets across all organizations.
            // The tenantFilter Hibernate filter is not applied in scheduler context
            // (no request-scoped tenant), so we query by status only.
            List<FixedAsset> activeAssets = fixedAssetRepository.findAll()
                    .stream()
                    .filter(a -> !a.isDeleted() && a.getStatus() == FixedAssetStatus.ACTIVE)
                    .toList();

            log.info("[RecurringDepreciationJob] Found {} ACTIVE fixed asset(s) to process", activeAssets.size());

            for (FixedAsset asset : activeAssets) {
                try {
                    if (asset.getUsefulLifeMonths() == null || asset.getUsefulLifeMonths() <= 0) {
                        log.debug("[RecurringDepreciationJob] Skipping asset {} — usefulLifeMonths is 0 or null",
                                asset.getId());
                        skipped.incrementAndGet();
                        continue;
                    }

                    BigDecimal currentValue = asset.getCurrentValue() != null
                            ? asset.getCurrentValue()
                            : BigDecimal.ZERO;

                    if (currentValue.compareTo(BigDecimal.ZERO) <= 0) {
                        // Already fully depreciated but status not yet updated — fix it.
                        asset.setCurrentValue(BigDecimal.ZERO);
                        asset.setStatus(FixedAssetStatus.DISPOSED);
                        fixedAssetRepository.save(asset);
                        log.info("[RecurringDepreciationJob] Asset {} already at zero book value — marked DISPOSED",
                                asset.getId());
                        fullyDepreciated.incrementAndGet();
                        continue;
                    }

                    // Estimate months elapsed from purchase date for non-linear methods.
                    int monthsElapsed = 0;
                    if (asset.getPurchaseDate() != null) {
                        java.time.LocalDate now = java.time.LocalDate.now();
                        monthsElapsed = (int) java.time.temporal.ChronoUnit.MONTHS.between(
                                asset.getPurchaseDate(), now);
                        monthsElapsed = Math.max(0, monthsElapsed);
                    }

                    BigDecimal depreciation = asset.calculateMonthlyDepreciation(monthsElapsed);

                    if (depreciation.compareTo(BigDecimal.ZERO) <= 0) {
                        log.debug("[RecurringDepreciationJob] Asset {} — zero depreciation, skipping",
                                asset.getId());
                        skipped.incrementAndGet();
                        continue;
                    }

                    BigDecimal newValue = currentValue.subtract(depreciation);

                    if (newValue.compareTo(BigDecimal.ZERO) <= 0) {
                        // Fully depreciated this month.
                        asset.setCurrentValue(BigDecimal.ZERO);
                        asset.setStatus(FixedAssetStatus.DISPOSED);
                        fixedAssetRepository.save(asset);
                        log.info("[RecurringDepreciationJob] Asset {} fully depreciated — book value zeroed, status DISPOSED " +
                                        "(was {} RUB, depreciation {} RUB)",
                                asset.getId(), currentValue, depreciation);
                        fullyDepreciated.incrementAndGet();
                    } else {
                        asset.setCurrentValue(newValue);
                        fixedAssetRepository.save(asset);
                        log.debug("[RecurringDepreciationJob] Asset {} — charged {} RUB, new book value {} RUB",
                                asset.getId(), depreciation, newValue);
                        charged.incrementAndGet();
                    }

                } catch (Exception e) {
                    log.error("[RecurringDepreciationJob] Error processing asset {}: {}",
                            asset.getId(), e.getMessage(), e);
                }
            }

            log.info("[RecurringDepreciationJob] Summary: charged={}, fullyDepreciated={}, skipped={}",
                    charged.get(), fullyDepreciated.get(), skipped.get());

        } catch (Exception e) {
            log.error("[RecurringDepreciationJob] FAILED: {}", e.getMessage(), e);
        }

        long elapsed = System.currentTimeMillis() - start;
        log.info("[RecurringDepreciationJob] END - Completed in {} ms", elapsed);
    }
}
