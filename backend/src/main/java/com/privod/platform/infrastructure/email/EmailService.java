package com.privod.platform.infrastructure.email;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.Map;

/**
 * Service for sending HTML emails rendered from Thymeleaf templates.
 * <p>
 * Usage example:
 * <pre>{@code
 * emailService.sendEmail(
 *     "user@example.com",
 *     "Subject",
 *     "email/contract-alert",
 *     Map.of("contractNumber", "K-2024-001", "daysLeft", 14)
 * );
 * }</pre>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;
    private final EmailConfig.EmailProperties emailProperties;

    /**
     * Render a Thymeleaf template and send the resulting HTML email.
     *
     * @param to           recipient email address
     * @param subject      email subject line
     * @param templateName template path relative to {@code templates/} (without {@code .html})
     * @param variables    model variables passed to the template
     */
    public void sendEmail(String to, String subject, String templateName, Map<String, Object> variables) {
        try {
            Context context = new Context(new Locale("ru"));
            context.setVariables(variables);
            context.setVariable("baseUrl", emailProperties.baseUrl());
            context.setVariable("companyName", emailProperties.fromName());

            String htmlContent = templateEngine.process(templateName, context);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message,
                    MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED,
                    StandardCharsets.UTF_8.name());

            helper.setFrom(emailProperties.fromAddress(), emailProperties.fromName());
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Email sent successfully to={} subject=\"{}\" template={}", to, subject, templateName);
        } catch (MessagingException e) {
            log.error("Failed to send email to={} subject=\"{}\": {}", to, subject, e.getMessage(), e);
            throw new EmailSendException("Failed to send email to " + to, e);
        } catch (java.io.UnsupportedEncodingException e) {
            log.error("Encoding error when sending email to={}: {}", to, e.getMessage(), e);
            throw new EmailSendException("Encoding error for email to " + to, e);
        }
    }

    /**
     * Send email asynchronously (fire-and-forget with logging).
     */
    @Async
    public void sendEmailAsync(String to, String subject, String templateName, Map<String, Object> variables) {
        sendEmail(to, subject, templateName, variables);
    }

    /**
     * Send email to multiple recipients with the same template.
     */
    public void sendBulkEmail(Iterable<String> recipients, String subject,
                              String templateName, Map<String, Object> variables) {
        for (String recipient : recipients) {
            try {
                sendEmail(recipient, subject, templateName, variables);
            } catch (Exception e) {
                log.error("Bulk email failed for recipient={}: {}", recipient, e.getMessage());
            }
        }
    }

    public static class EmailSendException extends RuntimeException {
        public EmailSendException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
