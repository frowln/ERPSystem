package com.privod.platform.infrastructure.scheduler.jobs;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Sends dunning (payment reminder) emails to organization admins whose subscriptions
 * are approaching their grace period end date.
 *
 * <p>Runs daily at 10:00. Checks for subscriptions with {@code grace_end_date}
 * approaching in 3 days and 1 day, and sends reminder emails to the organization's
 * admin users.
 */
@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(prefix = "app.scheduler", name = "enabled", havingValue = "true", matchIfMissing = true)
public class DunningEmailJob {

    private final JdbcTemplate jdbcTemplate;

    @Scheduled(cron = "0 0 10 * * *")
    public void sendDunningEmails() {
        long start = System.currentTimeMillis();
        log.info("[DunningEmailJob] START - Checking subscriptions for dunning reminders");

        try {
            // ------------------------------------------------------------------
            // Step 1: 3-day warning — grace_end_date is 3 days from now
            // ------------------------------------------------------------------
            List<Map<String, Object>> threeDayWarning = jdbcTemplate.queryForList(
                    """
                    SELECT ts.organization_id, ts.grace_end_date,
                           o.name AS org_name
                      FROM tenant_subscriptions ts
                      JOIN organizations o ON o.id = ts.organization_id AND o.deleted = false
                     WHERE ts.deleted = false
                       AND ts.status = 'ACTIVE'
                       AND ts.grace_end_date IS NOT NULL
                       AND ts.grace_end_date::date = (CURRENT_DATE + INTERVAL '3 days')::date
                    """
            );

            if (!threeDayWarning.isEmpty()) {
                log.info("[DunningEmailJob] {} subscription(s) with grace period ending in 3 days", threeDayWarning.size());
                for (Map<String, Object> row : threeDayWarning) {
                    sendDunningToOrgAdmins((UUID) row.get("organization_id"),
                            (String) row.get("org_name"), 3);
                }
            } else {
                log.info("[DunningEmailJob] No subscriptions with 3-day grace warning");
            }

            // ------------------------------------------------------------------
            // Step 2: 1-day warning — grace_end_date is tomorrow
            // ------------------------------------------------------------------
            List<Map<String, Object>> oneDayWarning = jdbcTemplate.queryForList(
                    """
                    SELECT ts.organization_id, ts.grace_end_date,
                           o.name AS org_name
                      FROM tenant_subscriptions ts
                      JOIN organizations o ON o.id = ts.organization_id AND o.deleted = false
                     WHERE ts.deleted = false
                       AND ts.status = 'ACTIVE'
                       AND ts.grace_end_date IS NOT NULL
                       AND ts.grace_end_date::date = (CURRENT_DATE + INTERVAL '1 day')::date
                    """
            );

            if (!oneDayWarning.isEmpty()) {
                log.warn("[DunningEmailJob] {} subscription(s) with grace period ending TOMORROW", oneDayWarning.size());
                for (Map<String, Object> row : oneDayWarning) {
                    sendDunningToOrgAdmins((UUID) row.get("organization_id"),
                            (String) row.get("org_name"), 1);
                }
            } else {
                log.info("[DunningEmailJob] No subscriptions with 1-day grace warning");
            }

        } catch (Exception e) {
            log.error("[DunningEmailJob] FAILED: {}", e.getMessage(), e);
        }

        long elapsed = System.currentTimeMillis() - start;
        log.info("[DunningEmailJob] END - Completed in {} ms", elapsed);
    }

    private void sendDunningToOrgAdmins(UUID organizationId, String orgName, int daysRemaining) {
        // Find admin users for this organization
        List<Map<String, Object>> admins = jdbcTemplate.queryForList(
                """
                SELECT u.id, u.email, u.first_name
                  FROM users u
                  JOIN user_roles ur ON ur.user_id = u.id
                  JOIN roles r ON r.id = ur.role_id AND r.code = 'ADMIN'
                 WHERE u.organization_id = ?
                   AND u.deleted = false
                """,
                organizationId
        );

        if (admins.isEmpty()) {
            log.warn("[DunningEmailJob] No admin users found for org {} ({})", orgName, organizationId);
            return;
        }

        String urgency = daysRemaining == 1 ? "СРОЧНО: " : "";
        String subject = urgency + "Оплата подписки — осталось " + daysRemaining + " дн. — Привод";

        for (Map<String, Object> admin : admins) {
            try {
                String email = (String) admin.get("email");
                String firstName = (String) admin.get("first_name");

                String body = buildDunningHtml(firstName, orgName, daysRemaining);

                jdbcTemplate.update(
                        """
                        INSERT INTO email_logs (id, organization_id, to_email, subject, body, status, created_at, deleted)
                        VALUES (gen_random_uuid(), ?, ?, ?, ?, 'QUEUED', NOW(), false)
                        """,
                        organizationId, email, subject, body
                );

                log.info("[DunningEmailJob] Dunning email queued for {} (org={}, days={})",
                        email, orgName, daysRemaining);
            } catch (Exception e) {
                log.warn("[DunningEmailJob] Failed to queue dunning email for admin {}: {}",
                        admin.get("email"), e.getMessage());
            }
        }
    }

    private String buildDunningHtml(String firstName, String orgName, int daysRemaining) {
        String urgencyBadge = daysRemaining == 1
                ? "<div style=\"background:#fef2f2;border:1px solid #ef4444;border-radius:6px;padding:12px 16px;margin-bottom:16px;\">"
                + "<p style=\"margin:0;color:#dc2626;font-weight:600;\">Подписка будет заблокирована завтра!</p></div>"
                : "<div style=\"background:#fff3cd;border:1px solid #ffc107;border-radius:6px;padding:12px 16px;margin-bottom:16px;\">"
                + "<p style=\"margin:0;color:#856404;\">До блокировки подписки осталось " + daysRemaining + " дня.</p></div>";

        return "<!DOCTYPE html>"
                + "<html lang=\"ru\">"
                + "<head><meta charset=\"UTF-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1.0\"></head>"
                + "<body style=\"margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;\">"
                + "<div style=\"max-width:600px;margin:0 auto;padding:20px;\">"
                + "  <div style=\"background:#4f46e5;padding:20px 24px;border-radius:12px 12px 0 0;\">"
                + "    <h1 style=\"margin:0;color:#fff;font-size:18px;font-weight:600;\">Привод</h1>"
                + "  </div>"
                + "  <div style=\"background:#fff;padding:32px 24px;border-radius:0 0 12px 12px;\">"
                + "    <h2 style=\"margin:0 0 16px;color:#1f2937;font-size:20px;\">Требуется оплата подписки</h2>"
                + "    <p>Здравствуйте, <strong>" + (firstName != null ? firstName : "") + "</strong>!</p>"
                + "    <p>Подписка организации <strong>" + (orgName != null ? orgName : "") + "</strong> требует продления.</p>"
                + "    " + urgencyBadge
                + "    <p>После истечения льготного периода доступ к системе будет ограничен. "
                + "       Чтобы продолжить работу без перерывов, пожалуйста, произведите оплату.</p>"
                + "    <div style=\"text-align:center;margin:24px 0;\">"
                + "      <a href=\"/settings/subscription\" style=\"display:inline-block;background:#4f46e5;color:#fff;padding:12px 32px;text-decoration:none;border-radius:6px;font-weight:600;\">Оплатить подписку</a>"
                + "    </div>"
                + "  </div>"
                + "  <div style=\"padding:16px 24px;text-align:center;\">"
                + "    <p style=\"margin:0;color:#9ca3af;font-size:12px;\">"
                + "      Это автоматическое уведомление от системы Привод."
                + "    </p>"
                + "  </div>"
                + "</div>"
                + "</body></html>";
    }
}
