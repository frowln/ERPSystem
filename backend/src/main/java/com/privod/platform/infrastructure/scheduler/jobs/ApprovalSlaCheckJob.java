package com.privod.platform.infrastructure.scheduler.jobs;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * P1-DOC-1: SLA проверка шагов согласования.
 * Каждые 30 минут помечает просроченные шаги (is_overdue = true)
 * и фиксирует время эскалации.
 *
 * Условие просрочки: status = 'PENDING' AND deadline IS NOT NULL AND deadline < NOW()
 */
@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(prefix = "app.scheduler", name = "enabled", havingValue = "true", matchIfMissing = true)
public class ApprovalSlaCheckJob {

    private final JdbcTemplate jdbcTemplate;

    @Scheduled(cron = "0 */30 * * * *") // каждые 30 минут
    public void checkApprovalSla() {
        long start = System.currentTimeMillis();
        log.info("[ApprovalSlaCheckJob] START — проверка SLA шагов согласования");

        try {
            // Помечаем просроченные шаги
            int overdueMark = jdbcTemplate.update(
                    "UPDATE approval_steps " +
                    "SET is_overdue = TRUE, " +
                    "    escalated_at = CASE WHEN escalated_at IS NULL THEN NOW() ELSE escalated_at END " +
                    "WHERE status = 'PENDING' " +
                    "  AND deadline IS NOT NULL " +
                    "  AND deadline < NOW() " +
                    "  AND (is_overdue = FALSE OR is_overdue IS NULL)"
            );

            // Количество уже просроченных (для мониторинга)
            Integer totalOverdue = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM approval_steps " +
                    "WHERE status = 'PENDING' AND is_overdue = TRUE",
                    Integer.class
            );

            long ms = System.currentTimeMillis() - start;
            log.info("[ApprovalSlaCheckJob] DONE — помечено просроченных: {}, всего в просрочке: {} ({}ms)",
                    overdueMark, totalOverdue, ms);
        } catch (Exception e) {
            log.error("[ApprovalSlaCheckJob] ERROR — {}", e.getMessage(), e);
        }
    }
}
