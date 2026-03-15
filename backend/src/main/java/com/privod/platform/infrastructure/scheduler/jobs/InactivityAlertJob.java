package com.privod.platform.infrastructure.scheduler.jobs;

import com.privod.platform.infrastructure.email.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * Daily job that sends inactivity email alerts to users who have not logged in
 * for 7 or more days. Runs every day at 08:00.
 *
 * <p>Queries {@code users} table joined against {@code login_audit_log} to find
 * active, non-deleted users with no recent login activity. Uses {@link EmailService}
 * (optional) to send reminder emails.
 */
@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(prefix = "app.scheduler", name = "enabled", havingValue = "true", matchIfMissing = true)
public class InactivityAlertJob {

    private final JdbcTemplate jdbcTemplate;

    @Autowired(required = false)
    private EmailService emailService;

    @Scheduled(cron = "0 0 8 * * *")
    public void checkInactiveUsers() {
        long start = System.currentTimeMillis();
        log.info("[InactivityAlertJob] START - Checking for inactive users (7+ days without login)");

        try {
            List<Map<String, Object>> inactiveUsers = jdbcTemplate.queryForList(
                    """
                    SELECT u.id, u.email, u.first_name, u.organization_id
                    FROM users u
                    WHERE u.deleted = false
                      AND u.active = true
                      AND u.id NOT IN (
                        SELECT DISTINCT l.user_id FROM login_audit_log l
                        WHERE l.created_at > NOW() - INTERVAL '7 days'
                      )
                      AND u.created_at < NOW() - INTERVAL '7 days'
                    """
            );

            log.info("[InactivityAlertJob] Found {} inactive users", inactiveUsers.size());

            int notified = 0;

            for (Map<String, Object> row : inactiveUsers) {
                String email = (String) row.get("email");
                String firstName = (String) row.get("first_name");

                if (emailService != null && email != null) {
                    try {
                        emailService.sendEmail(
                                email,
                                "Мы скучаем! Вернитесь в Привод",
                                "email/inactivity-alert",
                                Map.of("firstName", firstName != null ? firstName : "Пользователь")
                        );
                        notified++;
                    } catch (Exception e) {
                        log.warn("[InactivityAlertJob] Failed to send email to {}: {}", email, e.getMessage());
                    }
                }
            }

            log.info("[InactivityAlertJob] Notified {} out of {} inactive users", notified, inactiveUsers.size());

        } catch (Exception e) {
            log.error("[InactivityAlertJob] FAILED: {}", e.getMessage(), e);
        }

        long elapsed = System.currentTimeMillis() - start;
        log.info("[InactivityAlertJob] END - Completed in {} ms", elapsed);
    }
}
