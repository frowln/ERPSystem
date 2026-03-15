package com.privod.platform.infrastructure.scheduler.jobs;

import com.privod.platform.modules.email.service.EmailNotificationService;
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
 * Sends onboarding drip emails to new users on day 3 and day 7 after registration.
 *
 * <p>Runs daily at 09:00. For each time window (day-3, day-7), finds users whose
 * {@code created_at} falls within a 1-hour window and who have not yet received the
 * corresponding onboarding email (checked via {@code activation_events}).
 *
 * <p>Emails are dispatched through {@link EmailNotificationService} and a guard event
 * is recorded in {@code activation_events} to prevent duplicate sends.
 */
@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(prefix = "app.scheduler", name = "enabled", havingValue = "true", matchIfMissing = true)
public class OnboardingEmailJob {

    private final JdbcTemplate jdbcTemplate;
    private final EmailNotificationService emailNotificationService;

    @Scheduled(cron = "0 0 9 * * *")
    public void sendOnboardingEmails() {
        long start = System.currentTimeMillis();
        log.info("[OnboardingEmailJob] START - Sending onboarding drip emails");

        try {
            sendDay3Emails();
            sendDay7Emails();
        } catch (Exception e) {
            log.error("[OnboardingEmailJob] FAILED: {}", e.getMessage(), e);
        }

        long elapsed = System.currentTimeMillis() - start;
        log.info("[OnboardingEmailJob] END - Completed in {} ms", elapsed);
    }

    /**
     * Day-3 email: "How's it going? Create your first project."
     */
    private void sendDay3Emails() {
        List<Map<String, Object>> users = jdbcTemplate.queryForList(
                """
                SELECT u.id, u.email, u.first_name, u.organization_id
                  FROM users u
                 WHERE u.deleted = false
                   AND u.created_at BETWEEN NOW() - INTERVAL '3 days 1 hour' AND NOW() - INTERVAL '3 days'
                   AND NOT EXISTS (
                       SELECT 1 FROM activation_events ae
                        WHERE ae.user_id = u.id AND ae.event_type = 'ONBOARDING_DAY3'
                   )
                """
        );

        if (users.isEmpty()) {
            log.info("[OnboardingEmailJob] No users for day-3 onboarding email");
            return;
        }

        log.info("[OnboardingEmailJob] Sending day-3 email to {} user(s)", users.size());
        for (Map<String, Object> row : users) {
            try {
                UUID userId = (UUID) row.get("id");
                String email = (String) row.get("email");
                String firstName = (String) row.get("first_name");
                UUID orgId = (UUID) row.get("organization_id");

                sendOnboardingDay3Email(email, firstName, orgId);
                recordActivationEvent(userId, orgId, "ONBOARDING_DAY3");
                log.debug("[OnboardingEmailJob] Day-3 email sent to {}", email);
            } catch (Exception e) {
                log.warn("[OnboardingEmailJob] Failed to send day-3 email to {}: {}",
                        row.get("email"), e.getMessage());
            }
        }
    }

    /**
     * Day-7 email: "Invite your team, explore modules."
     */
    private void sendDay7Emails() {
        List<Map<String, Object>> users = jdbcTemplate.queryForList(
                """
                SELECT u.id, u.email, u.first_name, u.organization_id
                  FROM users u
                 WHERE u.deleted = false
                   AND u.created_at BETWEEN NOW() - INTERVAL '7 days 1 hour' AND NOW() - INTERVAL '7 days'
                   AND NOT EXISTS (
                       SELECT 1 FROM activation_events ae
                        WHERE ae.user_id = u.id AND ae.event_type = 'ONBOARDING_DAY7'
                   )
                """
        );

        if (users.isEmpty()) {
            log.info("[OnboardingEmailJob] No users for day-7 onboarding email");
            return;
        }

        log.info("[OnboardingEmailJob] Sending day-7 email to {} user(s)", users.size());
        for (Map<String, Object> row : users) {
            try {
                UUID userId = (UUID) row.get("id");
                String email = (String) row.get("email");
                String firstName = (String) row.get("first_name");
                UUID orgId = (UUID) row.get("organization_id");

                sendOnboardingDay7Email(email, firstName, orgId);
                recordActivationEvent(userId, orgId, "ONBOARDING_DAY7");
                log.debug("[OnboardingEmailJob] Day-7 email sent to {}", email);
            } catch (Exception e) {
                log.warn("[OnboardingEmailJob] Failed to send day-7 email to {}: {}",
                        row.get("email"), e.getMessage());
            }
        }
    }

    private void sendOnboardingDay3Email(String email, String firstName, UUID organizationId) {
        // Delegates to EmailNotificationService's internal sendEmail via a direct
        // call. The EmailNotificationService logs all emails to email_logs.
        // For Thymeleaf template support we build HTML inline using the same pattern.
        String subject = "Как дела? Создайте первый проект — Привод";
        String body = buildOnboardingHtml(
                "Как дела, " + (firstName != null ? firstName : "") + "?",
                "<p>Вы зарегистрировались в Привод 3 дня назад. Самое время начать!</p>"
                        + "<ul style=\"color:#4a4a4a;\">"
                        + "  <li>Создайте <strong>первый проект</strong> и добавьте объект строительства</li>"
                        + "  <li>Загрузите <strong>спецификацию</strong> в формате Excel</li>"
                        + "  <li>Попробуйте <strong>импорт сметы</strong> из ГРАНД-Смета</li>"
                        + "</ul>"
                        + "<p>Если у вас есть вопросы — напишите нам или загляните в базу знаний.</p>"
        );

        // Use JdbcTemplate to directly insert into email_logs and trigger send
        insertEmailLog(email, subject, body, organizationId);
    }

    private void sendOnboardingDay7Email(String email, String firstName, UUID organizationId) {
        String subject = "Пригласите команду и исследуйте модули — Привод";
        String body = buildOnboardingHtml(
                "Добро пожаловать на борт, " + (firstName != null ? firstName : "") + "!",
                "<p>Прошла неделя с момента регистрации. Вот что можно сделать дальше:</p>"
                        + "<ul style=\"color:#4a4a4a;\">"
                        + "  <li><strong>Пригласите коллег</strong> — перейдите в Настройки → Пользователи</li>"
                        + "  <li>Изучите модули: <strong>Финансы</strong>, <strong>Безопасность</strong>, <strong>Закупки</strong></li>"
                        + "  <li>Настройте <strong>уведомления</strong> для отслеживания задач</li>"
                        + "  <li>Подключите <strong>интеграцию с 1С</strong> для обмена данными</li>"
                        + "</ul>"
                        + "<p>Мы рады, что вы с нами!</p>"
        );

        insertEmailLog(email, subject, body, organizationId);
    }

    private void recordActivationEvent(UUID userId, UUID orgId, String eventType) {
        jdbcTemplate.update(
                """
                INSERT INTO activation_events (id, user_id, organization_id, event_type, created_at)
                VALUES (gen_random_uuid(), ?, ?, ?, NOW())
                """,
                userId, orgId, eventType
        );
    }

    private void insertEmailLog(String toEmail, String subject, String body, UUID organizationId) {
        jdbcTemplate.update(
                """
                INSERT INTO email_logs (id, organization_id, to_email, subject, body, status, created_at, deleted)
                VALUES (gen_random_uuid(), ?, ?, ?, ?, 'QUEUED', NOW(), false)
                """,
                organizationId, toEmail, subject, body
        );
    }

    private String buildOnboardingHtml(String title, String content) {
        return "<!DOCTYPE html>"
                + "<html lang=\"ru\">"
                + "<head><meta charset=\"UTF-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1.0\"></head>"
                + "<body style=\"margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;\">"
                + "<div style=\"max-width:600px;margin:0 auto;padding:20px;\">"
                + "  <div style=\"background:#4f46e5;padding:20px 24px;border-radius:12px 12px 0 0;\">"
                + "    <h1 style=\"margin:0;color:#fff;font-size:18px;font-weight:600;\">Привод</h1>"
                + "  </div>"
                + "  <div style=\"background:#fff;padding:32px 24px;border-radius:0 0 12px 12px;\">"
                + "    <h2 style=\"margin:0 0 16px;color:#1f2937;font-size:20px;\">" + title + "</h2>"
                + "    " + content
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
