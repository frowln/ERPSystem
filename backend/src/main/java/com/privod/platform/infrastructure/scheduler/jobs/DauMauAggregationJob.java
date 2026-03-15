package com.privod.platform.infrastructure.scheduler.jobs;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

/**
 * Daily aggregation of DAU (Daily Active Users), MAU (Monthly Active Users),
 * and new registration counts into the {@code usage_metrics} table.
 *
 * <p>Runs at 01:00 every day. Counts distinct users from {@code login_audit_logs}
 * for the previous day (DAU), for the last 30 days (MAU), and new user registrations
 * from the {@code users} table.
 */
@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(prefix = "app.scheduler", name = "enabled", havingValue = "true", matchIfMissing = true)
public class DauMauAggregationJob {

    private final JdbcTemplate jdbcTemplate;

    @Scheduled(cron = "0 0 1 * * *")
    public void aggregateDauMau() {
        long start = System.currentTimeMillis();
        log.info("[DauMauAggregationJob] START - Aggregating DAU/MAU metrics");

        try {
            LocalDate yesterday = LocalDate.now().minusDays(1);
            LocalDate thirtyDaysAgo = yesterday.minusDays(29);

            // ------------------------------------------------------------------
            // Step 1: DAU — count distinct users who logged in yesterday
            // ------------------------------------------------------------------
            Integer dau = jdbcTemplate.queryForObject(
                    """
                    SELECT COUNT(DISTINCT user_id)
                      FROM login_audit_logs
                     WHERE created_at >= ?::date
                       AND created_at < (?::date + INTERVAL '1 day')
                    """,
                    Integer.class, yesterday, yesterday
            );
            dau = dau != null ? dau : 0;

            jdbcTemplate.update(
                    """
                    INSERT INTO usage_metrics (id, metric_date, metric_type, metric_value, created_at)
                    VALUES (gen_random_uuid(), ?, 'DAU', ?, NOW())
                    """,
                    yesterday, dau
            );
            log.info("[DauMauAggregationJob] DAU for {}: {}", yesterday, dau);

            // ------------------------------------------------------------------
            // Step 2: MAU — count distinct users who logged in last 30 days
            // ------------------------------------------------------------------
            Integer mau = jdbcTemplate.queryForObject(
                    """
                    SELECT COUNT(DISTINCT user_id)
                      FROM login_audit_logs
                     WHERE created_at >= ?::date
                       AND created_at < (?::date + INTERVAL '1 day')
                    """,
                    Integer.class, thirtyDaysAgo, yesterday
            );
            mau = mau != null ? mau : 0;

            jdbcTemplate.update(
                    """
                    INSERT INTO usage_metrics (id, metric_date, metric_type, metric_value, created_at)
                    VALUES (gen_random_uuid(), ?, 'MAU', ?, NOW())
                    """,
                    yesterday, mau
            );
            log.info("[DauMauAggregationJob] MAU for {}: {}", yesterday, mau);

            // ------------------------------------------------------------------
            // Step 3: NEW_REGISTRATIONS — count users created yesterday
            // ------------------------------------------------------------------
            Integer newRegs = jdbcTemplate.queryForObject(
                    """
                    SELECT COUNT(*)
                      FROM users
                     WHERE created_at >= ?::date
                       AND created_at < (?::date + INTERVAL '1 day')
                       AND deleted = false
                    """,
                    Integer.class, yesterday, yesterday
            );
            newRegs = newRegs != null ? newRegs : 0;

            jdbcTemplate.update(
                    """
                    INSERT INTO usage_metrics (id, metric_date, metric_type, metric_value, created_at)
                    VALUES (gen_random_uuid(), ?, 'NEW_REGISTRATIONS', ?, NOW())
                    """,
                    yesterday, newRegs
            );
            log.info("[DauMauAggregationJob] New registrations for {}: {}", yesterday, newRegs);

        } catch (Exception e) {
            log.error("[DauMauAggregationJob] FAILED: {}", e.getMessage(), e);
        }

        long elapsed = System.currentTimeMillis() - start;
        log.info("[DauMauAggregationJob] END - Completed in {} ms", elapsed);
    }
}
