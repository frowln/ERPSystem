package com.privod.platform.modules.email.service;

import com.privod.platform.modules.auth.domain.User;
import com.privod.platform.modules.email.domain.EmailLog;
import com.privod.platform.modules.email.domain.EmailLogStatus;
import com.privod.platform.modules.email.repository.EmailLogRepository;
import com.privod.platform.modules.finance.domain.Budget;
import com.privod.platform.modules.task.domain.ProjectTask;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Service for sending system notification emails (task assignments, approvals,
 * budget alerts, safety alerts, password resets, welcome emails).
 * All emails are logged to email_logs table and sent asynchronously.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailNotificationService {

    private final JavaMailSender mailSender;
    private final EmailLogRepository emailLogRepository;

    @Value("${app.email.from-address:noreply@privod.ru}")
    private String fromAddress;

    @Value("${app.email.from-name:Привод - Строительная ERP}")
    private String fromName;

    @Value("${app.email.base-url:http://localhost:3000}")
    private String baseUrl;

    // ---------------------------------------------------------------------------
    // Public API — notification methods
    // ---------------------------------------------------------------------------

    /**
     * Notify a user that a task has been assigned to them.
     */
    @Async
    public void sendTaskAssigned(User assignee, ProjectTask task) {
        String subject = "Новая задача: " + task.getTitle();
        String body = buildHtmlTemplate(
                "Вам назначена новая задача",
                "<p>Здравствуйте, <strong>" + assignee.getFirstName() + "</strong>!</p>"
                        + "<p>Вам назначена задача:</p>"
                        + "<div style=\"background:#f8f9fa;padding:16px;border-radius:8px;margin:16px 0;\">"
                        + "<p style=\"margin:0;\"><strong>" + task.getCode() + "</strong> — " + task.getTitle() + "</p>"
                        + (task.getDescription() != null ? "<p style=\"color:#6b7280;margin:8px 0 0;\">" + truncate(task.getDescription(), 200) + "</p>" : "")
                        + (task.getPlannedEndDate() != null ? "<p style=\"color:#6b7280;margin:8px 0 0;\">Срок: " + task.getPlannedEndDate() + "</p>" : "")
                        + "</div>"
                        + "<a href=\"" + baseUrl + "/tasks/" + task.getId() + "\" style=\"display:inline-block;background:#4f46e5;color:#fff;padding:10px 24px;text-decoration:none;border-radius:6px;margin-top:8px;\">Открыть задачу</a>"
        );

        sendEmail(assignee.getEmail(), subject, body, assignee.getOrganizationId());
    }

    /**
     * Notify a user that their approval is required for an entity.
     */
    @Async
    public void sendApprovalRequired(User approver, String entityType, UUID entityId) {
        String entityName = translateEntityType(entityType);
        String subject = "Требуется согласование: " + entityName;
        String body = buildHtmlTemplate(
                "Требуется ваше согласование",
                "<p>Здравствуйте, <strong>" + approver.getFirstName() + "</strong>!</p>"
                        + "<p>Требуется ваше согласование для документа:</p>"
                        + "<div style=\"background:#f8f9fa;padding:16px;border-radius:8px;margin:16px 0;\">"
                        + "<p style=\"margin:0;\"><strong>Тип:</strong> " + entityName + "</p>"
                        + "<p style=\"margin:8px 0 0;\"><strong>ID:</strong> " + entityId + "</p>"
                        + "</div>"
                        + "<a href=\"" + baseUrl + "/approvals\" style=\"display:inline-block;background:#4f46e5;color:#fff;padding:10px 24px;text-decoration:none;border-radius:6px;margin-top:8px;\">Перейти к согласованиям</a>"
        );

        sendEmail(approver.getEmail(), subject, body, approver.getOrganizationId());
    }

    /**
     * Notify a manager about a budget alert (overspend, threshold exceeded, etc.).
     */
    @Async
    public void sendBudgetAlert(User manager, Budget budget, String alertType) {
        String alertDescription = translateAlertType(alertType);
        String subject = "Бюджетное предупреждение: " + budget.getName();
        String body = buildHtmlTemplate(
                "Бюджетное предупреждение",
                "<p>Здравствуйте, <strong>" + manager.getFirstName() + "</strong>!</p>"
                        + "<p>Обнаружено предупреждение по бюджету:</p>"
                        + "<div style=\"background:#fef3c7;padding:16px;border-radius:8px;margin:16px 0;border-left:4px solid #f59e0b;\">"
                        + "<p style=\"margin:0;\"><strong>Бюджет:</strong> " + budget.getName() + "</p>"
                        + "<p style=\"margin:8px 0 0;\"><strong>Тип предупреждения:</strong> " + alertDescription + "</p>"
                        + "<p style=\"margin:8px 0 0;\"><strong>Плановая стоимость:</strong> " + budget.getPlannedCost() + " руб.</p>"
                        + "<p style=\"margin:8px 0 0;\"><strong>Фактическая стоимость:</strong> " + budget.getActualCost() + " руб.</p>"
                        + "</div>"
                        + "<a href=\"" + baseUrl + "/finance/budgets/" + budget.getId() + "\" style=\"display:inline-block;background:#4f46e5;color:#fff;padding:10px 24px;text-decoration:none;border-radius:6px;margin-top:8px;\">Открыть бюджет</a>"
        );

        sendEmail(manager.getEmail(), subject, body, manager.getOrganizationId());
    }

    /**
     * Send a safety alert to multiple recipients.
     */
    @Async
    public void sendSafetyAlert(List<User> recipients, String alertMessage) {
        String subject = "Предупреждение ОТиТБ";
        String body = buildHtmlTemplate(
                "Предупреждение по охране труда",
                "<p>Внимание! Получено предупреждение по охране труда и технике безопасности:</p>"
                        + "<div style=\"background:#fef2f2;padding:16px;border-radius:8px;margin:16px 0;border-left:4px solid #ef4444;\">"
                        + "<p style=\"margin:0;font-weight:600;color:#dc2626;\">" + alertMessage + "</p>"
                        + "</div>"
                        + "<p style=\"color:#6b7280;\">Пожалуйста, примите необходимые меры.</p>"
                        + "<a href=\"" + baseUrl + "/safety\" style=\"display:inline-block;background:#dc2626;color:#fff;padding:10px 24px;text-decoration:none;border-radius:6px;margin-top:8px;\">Перейти к безопасности</a>"
        );

        for (User recipient : recipients) {
            sendEmail(recipient.getEmail(), subject, body, recipient.getOrganizationId());
        }
    }

    /**
     * Send a password reset email with a reset link containing the token.
     */
    @Async
    public void sendPasswordReset(User user, String resetToken) {
        String subject = "Сброс пароля — Привод";
        String resetLink = baseUrl + "/auth/reset-password?token=" + resetToken;
        String body = buildHtmlTemplate(
                "Сброс пароля",
                "<p>Здравствуйте, <strong>" + user.getFirstName() + "</strong>!</p>"
                        + "<p>Мы получили запрос на сброс вашего пароля. Нажмите на кнопку ниже для создания нового пароля:</p>"
                        + "<div style=\"text-align:center;margin:24px 0;\">"
                        + "<a href=\"" + resetLink + "\" style=\"display:inline-block;background:#4f46e5;color:#fff;padding:12px 32px;text-decoration:none;border-radius:6px;font-weight:600;\">Сбросить пароль</a>"
                        + "</div>"
                        + "<p style=\"color:#6b7280;font-size:13px;\">Если вы не запрашивали сброс пароля, проигнорируйте это письмо. Ссылка действительна 24 часа.</p>"
        );

        sendEmail(user.getEmail(), subject, body, user.getOrganizationId());
    }

    /**
     * Send an email verification link to a user.
     */
    @Async
    public void sendEmailVerification(User user, String verificationToken) {
        String subject = "Подтверждение email — Привод";
        String verifyLink = baseUrl + "/auth/verify-email?token=" + verificationToken;
        String body = buildHtmlTemplate(
                "Подтвердите ваш email",
                "<p>Здравствуйте, <strong>" + user.getFirstName() + "</strong>!</p>"
                        + "<p>Для завершения регистрации подтвердите ваш email-адрес, нажав на кнопку ниже:</p>"
                        + "<div style=\"text-align:center;margin:24px 0;\">"
                        + "<a href=\"" + verifyLink + "\" style=\"display:inline-block;background:#4f46e5;color:#fff;padding:12px 32px;text-decoration:none;border-radius:6px;font-weight:600;\">Подтвердить email</a>"
                        + "</div>"
                        + "<p style=\"color:#6b7280;font-size:13px;\">Если вы не регистрировались в системе Привод, проигнорируйте это письмо. Ссылка действительна 24 часа.</p>"
        );

        sendEmail(user.getEmail(), subject, body, user.getOrganizationId());
    }

    /**
     * Send a welcome email to a newly registered user.
     */
    @Async
    public void sendWelcome(User user) {
        String subject = "Добро пожаловать в Привод!";
        String body = buildHtmlTemplate(
                "Добро пожаловать!",
                "<p>Здравствуйте, <strong>" + user.getFirstName() + " " + user.getLastName() + "</strong>!</p>"
                        + "<p>Ваша учётная запись в системе <strong>Привод</strong> успешно создана.</p>"
                        + "<div style=\"background:#f8f9fa;padding:16px;border-radius:8px;margin:16px 0;\">"
                        + "<p style=\"margin:0;\"><strong>Email:</strong> " + user.getEmail() + "</p>"
                        + "</div>"
                        + "<p>Для начала работы перейдите по ссылке ниже:</p>"
                        + "<a href=\"" + baseUrl + "/login\" style=\"display:inline-block;background:#4f46e5;color:#fff;padding:10px 24px;text-decoration:none;border-radius:6px;margin-top:8px;\">Войти в систему</a>"
        );

        sendEmail(user.getEmail(), subject, body, user.getOrganizationId());
    }

    // ---------------------------------------------------------------------------
    // Internal — send email and log it
    // ---------------------------------------------------------------------------

    private void sendEmail(String toEmail, String subject, String htmlBody, UUID organizationId) {
        EmailLog emailLog = EmailLog.builder()
                .organizationId(organizationId)
                .toEmail(toEmail)
                .subject(subject)
                .body(htmlBody)
                .status(EmailLogStatus.QUEUED)
                .build();

        emailLog = emailLogRepository.save(emailLog);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress, fromName);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);

            mailSender.send(message);

            emailLog.setStatus(EmailLogStatus.SENT);
            emailLog.setSentAt(Instant.now());
            log.info("Email отправлен: to={}, subject={}", toEmail, subject);
        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
            emailLog.setStatus(EmailLogStatus.FAILED);
            emailLog.setErrorMessage(e.getMessage());
            log.error("Ошибка отправки email на {}: {}", toEmail, e.getMessage());
        } catch (Exception e) {
            emailLog.setStatus(EmailLogStatus.FAILED);
            emailLog.setErrorMessage(e.getMessage());
            log.error("Непредвиденная ошибка отправки email на {}: {}", toEmail, e.getMessage());
        }

        emailLogRepository.save(emailLog);
    }

    // ---------------------------------------------------------------------------
    // HTML template builder
    // ---------------------------------------------------------------------------

    private String buildHtmlTemplate(String title, String content) {
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
                + "      Это автоматическое уведомление от системы Привод.<br>"
                + "      Настроить уведомления: <a href=\"" + baseUrl + "/settings/email-preferences\" style=\"color:#4f46e5;\">Настройки</a>"
                + "    </p>"
                + "  </div>"
                + "</div>"
                + "</body></html>";
    }

    // ---------------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------------

    private String translateEntityType(String entityType) {
        return switch (entityType) {
            case "Budget" -> "Бюджет";
            case "Invoice" -> "Счёт";
            case "Contract" -> "Договор";
            case "PurchaseRequest" -> "Заявка на закупку";
            case "ChangeOrder" -> "Запрос на изменение";
            case "Estimate" -> "Смета";
            default -> entityType;
        };
    }

    private String translateAlertType(String alertType) {
        return switch (alertType) {
            case "OVERSPEND" -> "Перерасход бюджета";
            case "THRESHOLD_80" -> "Бюджет использован на 80%";
            case "THRESHOLD_90" -> "Бюджет использован на 90%";
            case "COST_VARIANCE" -> "Отклонение по стоимости";
            case "REVENUE_SHORTFALL" -> "Недостаток выручки";
            default -> alertType;
        };
    }

    private String truncate(String value, int maxLength) {
        if (value == null) return "";
        return value.length() > maxLength ? value.substring(0, maxLength) + "..." : value;
    }
}
