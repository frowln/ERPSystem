package com.privod.platform.infrastructure.scheduler.jobs;

import com.privod.platform.modules.subscription.domain.BillingPeriod;
import com.privod.platform.modules.subscription.domain.BillingRecord;
import com.privod.platform.modules.subscription.domain.BillingType;
import com.privod.platform.modules.subscription.domain.PaymentStatus;
import com.privod.platform.modules.subscription.domain.SubscriptionPlan;
import com.privod.platform.modules.subscription.repository.BillingRecordRepository;
import com.privod.platform.modules.subscription.repository.SubscriptionPlanRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Automatically renews subscriptions that are ACTIVE, have auto_renew=true,
 * and whose end_date is approaching (within 3 days).
 * Creates a billing record for each renewal and extends the subscription period
 * by 1 month (MONTHLY) or 12 months (YEARLY) based on the plan's billing period.
 * Runs daily at 02:00.
 */
@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(prefix = "app.scheduler", name = "enabled", havingValue = "true", matchIfMissing = true)
public class RecurringBillingJob {

    private final JdbcTemplate jdbcTemplate;
    private final SubscriptionPlanRepository planRepository;
    private final BillingRecordRepository billingRecordRepository;

    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void processRecurringBilling() {
        long start = System.currentTimeMillis();
        log.info("[RecurringBillingJob] START");

        try {
            // Find subscriptions due for renewal (auto_renew=true, expiring within 3 days)
            List<Map<String, Object>> dueSubscriptions = jdbcTemplate.queryForList(
                    "SELECT ts.id AS sub_id, ts.organization_id, ts.plan_id, ts.end_date " +
                    "FROM tenant_subscriptions ts " +
                    "WHERE ts.status = 'ACTIVE' " +
                    "  AND ts.auto_renew = true " +
                    "  AND ts.end_date IS NOT NULL " +
                    "  AND ts.end_date <= NOW() + INTERVAL '3 days' " +
                    "  AND ts.deleted = false");

            int renewed = 0;
            for (Map<String, Object> row : dueSubscriptions) {
                UUID subId = (UUID) row.get("sub_id");
                UUID organizationId = (UUID) row.get("organization_id");
                UUID planId = (UUID) row.get("plan_id");

                SubscriptionPlan plan = planRepository.findByIdAndDeletedFalse(planId).orElse(null);
                if (plan == null) {
                    log.warn("[RecurringBillingJob] Plan not found for subscription {}, skipping", subId);
                    continue;
                }

                // Determine renewal interval based on billing period
                boolean isYearly = plan.getBillingPeriod() == BillingPeriod.YEARLY;
                String interval = isYearly ? "12 months" : "1 month";
                long periodDays = isYearly ? 365 : 30;

                // Extend the subscription end date
                int updated = jdbcTemplate.update(
                        "UPDATE tenant_subscriptions " +
                        "SET end_date = end_date + INTERVAL '" + interval + "', " +
                        "    grace_end_date = NULL, " +
                        "    updated_at = NOW() " +
                        "WHERE id = ? AND deleted = false",
                        subId);

                if (updated > 0) {
                    renewed++;

                    // Create billing record for the renewal
                    if (plan.getPrice().compareTo(BigDecimal.ZERO) > 0) {
                        Instant now = Instant.now();
                        BillingRecord billingRecord = BillingRecord.builder()
                                .organizationId(organizationId)
                                .subscriptionId(subId)
                                .planName(plan.getName().name())
                                .planDisplayName(plan.getDisplayName())
                                .amount(plan.getPrice())
                                .currency(plan.getCurrency())
                                .billingType(BillingType.SUBSCRIPTION)
                                .paymentStatus(PaymentStatus.PENDING)
                                .invoiceDate(now)
                                .periodStart(now)
                                .periodEnd(now.plus(periodDays, ChronoUnit.DAYS))
                                .invoiceNumber("INV-R-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                                .description("Автопродление подписки: " + plan.getDisplayName())
                                .build();
                        billingRecordRepository.save(billingRecord);

                        log.info("[RecurringBillingJob] Created billing record for subscription {} (org={}, plan={}, amount={})",
                                subId, organizationId, plan.getName(), plan.getPrice());
                    }
                }
            }

            if (renewed > 0) {
                log.info("[RecurringBillingJob] Auto-renewed {} subscriptions", renewed);
            }

        } catch (Exception e) {
            log.error("[RecurringBillingJob] FAILED: {}", e.getMessage(), e);
        }

        long elapsed = System.currentTimeMillis() - start;
        log.info("[RecurringBillingJob] END - Completed in {} ms", elapsed);
    }
}
