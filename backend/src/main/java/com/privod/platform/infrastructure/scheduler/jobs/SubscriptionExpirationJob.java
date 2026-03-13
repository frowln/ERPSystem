package com.privod.platform.infrastructure.scheduler.jobs;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Expires subscriptions whose end date has passed.
 * Supports a grace period (default 7 days) before full expiration.
 * Runs daily at 01:00.
 */
@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(prefix = "app.scheduler", name = "enabled", havingValue = "true", matchIfMissing = true)
public class SubscriptionExpirationJob {

    private final JdbcTemplate jdbcTemplate;

    @Value("${app.subscription.grace-period-days:7}")
    private int gracePeriodDays;

    @Scheduled(cron = "0 0 1 * * *")
    public void expireSubscriptions() {
        long start = System.currentTimeMillis();
        log.info("[SubscriptionExpirationJob] START (grace period: {} days)", gracePeriodDays);

        try {
            // Step 1: ACTIVE subscriptions past end_date → set grace_end_date (if not already set)
            int gracedActive = jdbcTemplate.update(
                    "UPDATE tenant_subscriptions SET grace_end_date = end_date + INTERVAL '1 day' * ?, updated_at = NOW() " +
                    "WHERE status = 'ACTIVE' AND end_date < NOW() AND grace_end_date IS NULL AND deleted = false",
                    gracePeriodDays);

            // Step 2: ACTIVE subscriptions past grace_end_date → EXPIRED
            int expiredActive = jdbcTemplate.update(
                    "UPDATE tenant_subscriptions SET status = 'EXPIRED', updated_at = NOW() " +
                    "WHERE status = 'ACTIVE' AND grace_end_date IS NOT NULL AND grace_end_date < NOW() AND deleted = false");

            // Step 3: TRIAL subscriptions past trial_end_date → EXPIRED (no grace for trials)
            int expiredTrial = jdbcTemplate.update(
                    "UPDATE tenant_subscriptions SET status = 'EXPIRED', updated_at = NOW() " +
                    "WHERE status = 'TRIAL' AND trial_end_date < NOW() AND deleted = false");

            log.info("[SubscriptionExpirationJob] Graced {} active, expired {} active + {} trial subscriptions",
                    gracedActive, expiredActive, expiredTrial);
        } catch (Exception e) {
            log.error("[SubscriptionExpirationJob] FAILED: {}", e.getMessage(), e);
        }

        long elapsed = System.currentTimeMillis() - start;
        log.info("[SubscriptionExpirationJob] END - Completed in {} ms", elapsed);
    }
}
