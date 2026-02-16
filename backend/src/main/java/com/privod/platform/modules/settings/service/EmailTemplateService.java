package com.privod.platform.modules.settings.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.settings.domain.EmailTemplate;
import com.privod.platform.modules.settings.domain.EmailTemplateCategory;
import com.privod.platform.modules.settings.repository.EmailTemplateRepository;
import com.privod.platform.modules.settings.web.dto.CreateEmailTemplateRequest;
import com.privod.platform.modules.settings.web.dto.EmailTemplateResponse;
import com.privod.platform.modules.settings.web.dto.RenderedTemplateResponse;
import com.privod.platform.modules.settings.web.dto.UpdateEmailTemplateRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailTemplateService {

    private final EmailTemplateRepository emailTemplateRepository;
    private final JavaMailSender mailSender;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<EmailTemplateResponse> listTemplates(String search, Pageable pageable) {
        if (search != null && !search.isBlank()) {
            return emailTemplateRepository.searchByNameOrCode(search, pageable)
                    .map(EmailTemplateResponse::fromEntity);
        }
        return emailTemplateRepository.findByDeletedFalse(pageable)
                .map(EmailTemplateResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public EmailTemplateResponse getByCode(String code) {
        EmailTemplate template = getTemplateOrThrow(code);
        return EmailTemplateResponse.fromEntity(template);
    }

    @Transactional(readOnly = true)
    public EmailTemplateResponse getById(UUID id) {
        EmailTemplate template = emailTemplateRepository.findById(id)
                .filter(t -> !t.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Шаблон email не найден: " + id));
        return EmailTemplateResponse.fromEntity(template);
    }

    @Transactional(readOnly = true)
    public List<EmailTemplateResponse> getByCategory(EmailTemplateCategory category) {
        return emailTemplateRepository.findByCategoryAndDeletedFalseOrderByNameAsc(category)
                .stream()
                .map(EmailTemplateResponse::fromEntity)
                .toList();
    }

    @Transactional
    public EmailTemplateResponse createTemplate(CreateEmailTemplateRequest request) {
        if (emailTemplateRepository.existsByCodeAndDeletedFalse(request.code())) {
            throw new IllegalArgumentException("Шаблон с кодом '" + request.code() + "' уже существует");
        }

        EmailTemplate template = EmailTemplate.builder()
                .code(request.code())
                .name(request.name())
                .subject(request.subject())
                .bodyHtml(request.bodyHtml())
                .bodyText(request.bodyText())
                .category(request.category())
                .variables(request.variables() != null ? request.variables() : new ArrayList<>())
                .build();

        template = emailTemplateRepository.save(template);
        auditService.logCreate("EmailTemplate", template.getId());

        log.info("Email template created: {} ({})", template.getCode(), template.getId());
        return EmailTemplateResponse.fromEntity(template);
    }

    @Transactional
    public EmailTemplateResponse updateTemplate(UUID id, UpdateEmailTemplateRequest request) {
        EmailTemplate template = emailTemplateRepository.findById(id)
                .filter(t -> !t.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Шаблон email не найден: " + id));

        if (request.name() != null) {
            template.setName(request.name());
        }
        if (request.subject() != null) {
            template.setSubject(request.subject());
        }
        if (request.bodyHtml() != null) {
            template.setBodyHtml(request.bodyHtml());
        }
        if (request.bodyText() != null) {
            template.setBodyText(request.bodyText());
        }
        if (request.category() != null) {
            template.setCategory(request.category());
        }
        if (request.variables() != null) {
            template.setVariables(request.variables());
        }
        if (request.isActive() != null) {
            template.setActive(request.isActive());
        }

        template = emailTemplateRepository.save(template);
        auditService.logUpdate("EmailTemplate", template.getId(), "multiple", null, null);

        log.info("Email template updated: {} ({})", template.getCode(), template.getId());
        return EmailTemplateResponse.fromEntity(template);
    }

    @Transactional
    public void deleteTemplate(UUID id) {
        EmailTemplate template = emailTemplateRepository.findById(id)
                .filter(t -> !t.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Шаблон email не найден: " + id));

        template.softDelete();
        emailTemplateRepository.save(template);
        auditService.logDelete("EmailTemplate", template.getId());

        log.info("Email template deleted: {} ({})", template.getCode(), template.getId());
    }

    /**
     * Renders a template by replacing {{variable}} placeholders with actual values.
     */
    @Transactional(readOnly = true)
    public RenderedTemplateResponse renderTemplate(String code, Map<String, String> variables) {
        EmailTemplate template = getTemplateOrThrow(code);

        if (!template.isActive()) {
            throw new IllegalStateException("Шаблон '" + code + "' неактивен");
        }

        String subject = replaceVariables(template.getSubject(), variables);
        String bodyHtml = replaceVariables(template.getBodyHtml(), variables);
        String bodyText = replaceVariables(template.getBodyText(), variables);

        return new RenderedTemplateResponse(subject, bodyHtml, bodyText);
    }

    /**
     * Sends an email using a template. Renders the template and sends via JavaMailSender.
     */
    @Transactional
    public void sendEmail(String code, String recipientEmail, Map<String, String> variables) {
        RenderedTemplateResponse rendered = renderTemplate(code, variables);

        try {
            jakarta.mail.internet.MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(recipientEmail);
            helper.setSubject(rendered.subject());
            helper.setFrom("noreply@privod.ru", "Привод ERP");
            if (rendered.bodyHtml() != null && !rendered.bodyHtml().isBlank()) {
                helper.setText(rendered.bodyText() != null ? rendered.bodyText() : "", rendered.bodyHtml());
            } else {
                helper.setText(rendered.bodyText() != null ? rendered.bodyText() : "");
            }
            mailSender.send(message);
            log.info("Email sent to {}: subject='{}', template='{}'", recipientEmail, rendered.subject(), code);
        } catch (Exception e) {
            log.error("Failed to send email to {} using template '{}': {}", recipientEmail, code, e.getMessage(), e);
            throw new RuntimeException("Ошибка отправки email: " + e.getMessage(), e);
        }
    }

    private EmailTemplate getTemplateOrThrow(String code) {
        return emailTemplateRepository.findByCodeAndDeletedFalse(code)
                .orElseThrow(() -> new EntityNotFoundException("Шаблон email не найден: " + code));
    }

    private String replaceVariables(String text, Map<String, String> variables) {
        if (text == null || variables == null) {
            return text;
        }
        String result = text;
        for (Map.Entry<String, String> entry : variables.entrySet()) {
            result = result.replace("{{" + entry.getKey() + "}}", entry.getValue() != null ? entry.getValue() : "");
        }
        return result;
    }
}
