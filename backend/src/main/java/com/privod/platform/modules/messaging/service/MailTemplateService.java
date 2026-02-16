package com.privod.platform.modules.messaging.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.messaging.domain.MailTemplate;
import com.privod.platform.modules.messaging.repository.MailTemplateRepository;
import com.privod.platform.modules.messaging.web.dto.CreateMailTemplateRequest;
import com.privod.platform.modules.messaging.web.dto.MailTemplateResponse;
import com.privod.platform.modules.messaging.web.dto.RenderTemplateRequest;
import com.privod.platform.modules.messaging.web.dto.RenderedTemplateResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MailTemplateService {

    private final MailTemplateRepository mailTemplateRepository;
    private final AuditService auditService;

    @Transactional
    public MailTemplateResponse createTemplate(CreateMailTemplateRequest request) {
        MailTemplate template = MailTemplate.builder()
                .name(request.name())
                .modelName(request.modelName())
                .subject(request.subject())
                .bodyHtml(request.bodyHtml())
                .emailFrom(request.emailFrom())
                .emailTo(request.emailTo())
                .emailCc(request.emailCc())
                .replyTo(request.replyTo())
                .isActive(true)
                .lang(request.lang())
                .build();
        template = mailTemplateRepository.save(template);
        auditService.logCreate("MailTemplate", template.getId());
        return MailTemplateResponse.fromEntity(template);
    }

    @Transactional
    public MailTemplateResponse updateTemplate(UUID templateId, CreateMailTemplateRequest request) {
        MailTemplate template = mailTemplateRepository.findById(templateId)
                .orElseThrow(() -> new EntityNotFoundException("Шаблон не найден: " + templateId));
        if (template.isDeleted()) {
            throw new EntityNotFoundException("Шаблон удален");
        }
        template.setName(request.name());
        template.setModelName(request.modelName());
        template.setSubject(request.subject());
        template.setBodyHtml(request.bodyHtml());
        template.setEmailFrom(request.emailFrom());
        template.setEmailTo(request.emailTo());
        template.setEmailCc(request.emailCc());
        template.setReplyTo(request.replyTo());
        template.setLang(request.lang());
        template = mailTemplateRepository.save(template);
        auditService.logUpdate("MailTemplate", templateId, "name", null, request.name());
        return MailTemplateResponse.fromEntity(template);
    }

    @Transactional
    public void deleteTemplate(UUID templateId) {
        MailTemplate template = mailTemplateRepository.findById(templateId)
                .orElseThrow(() -> new EntityNotFoundException("Шаблон не найден: " + templateId));
        template.softDelete();
        mailTemplateRepository.save(template);
        auditService.logDelete("MailTemplate", templateId);
    }

    @Transactional
    public MailTemplateResponse toggleActive(UUID templateId) {
        MailTemplate template = mailTemplateRepository.findById(templateId)
                .orElseThrow(() -> new EntityNotFoundException("Шаблон не найден: " + templateId));
        if (template.isDeleted()) {
            throw new EntityNotFoundException("Шаблон удален");
        }
        boolean oldActive = template.isActive();
        template.setActive(!oldActive);
        template = mailTemplateRepository.save(template);
        auditService.logUpdate("MailTemplate", templateId, "isActive",
                String.valueOf(oldActive), String.valueOf(template.isActive()));
        return MailTemplateResponse.fromEntity(template);
    }

    @Transactional(readOnly = true)
    public MailTemplateResponse getTemplate(UUID templateId) {
        MailTemplate template = mailTemplateRepository.findById(templateId)
                .orElseThrow(() -> new EntityNotFoundException("Шаблон не найден: " + templateId));
        return MailTemplateResponse.fromEntity(template);
    }

    @Transactional(readOnly = true)
    public List<MailTemplateResponse> getAllTemplates() {
        return mailTemplateRepository.findAllActive()
                .stream()
                .map(MailTemplateResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MailTemplateResponse> getTemplatesByModel(String modelName) {
        return mailTemplateRepository.findByModelName(modelName)
                .stream()
                .map(MailTemplateResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public RenderedTemplateResponse renderTemplate(RenderTemplateRequest request) {
        MailTemplate template = mailTemplateRepository.findById(request.templateId())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Шаблон не найден: " + request.templateId()));
        if (template.isDeleted() || !template.isActive()) {
            throw new IllegalStateException("Шаблон недоступен для рендеринга");
        }

        Map<String, String> placeholders = request.placeholders() != null
                ? request.placeholders()
                : Map.of();

        String renderedSubject = replacePlaceholders(template.getSubject(), placeholders);
        String renderedBody = replacePlaceholders(template.getBodyHtml(), placeholders);
        String renderedEmailFrom = replacePlaceholders(template.getEmailFrom(), placeholders);
        String renderedEmailTo = replacePlaceholders(template.getEmailTo(), placeholders);
        String renderedEmailCc = replacePlaceholders(template.getEmailCc(), placeholders);
        String renderedReplyTo = replacePlaceholders(template.getReplyTo(), placeholders);

        return new RenderedTemplateResponse(
                renderedSubject,
                renderedBody,
                renderedEmailFrom,
                renderedEmailTo,
                renderedEmailCc,
                renderedReplyTo
        );
    }

    private String replacePlaceholders(String text, Map<String, String> placeholders) {
        if (text == null || text.isEmpty()) {
            return text;
        }
        String result = text;
        for (Map.Entry<String, String> entry : placeholders.entrySet()) {
            String placeholder = "{{" + entry.getKey() + "}}";
            String value = entry.getValue() != null ? entry.getValue() : "";
            result = result.replace(placeholder, value);
        }
        return result;
    }
}
