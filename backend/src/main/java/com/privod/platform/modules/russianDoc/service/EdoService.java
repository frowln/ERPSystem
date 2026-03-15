package com.privod.platform.modules.russianDoc.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.russianDoc.domain.EdoDocumentStatus;
import com.privod.platform.modules.russianDoc.domain.EdoGeneratedDocument;
import com.privod.platform.modules.russianDoc.domain.EdoTemplate;
import com.privod.platform.modules.russianDoc.repository.EdoGeneratedDocumentRepository;
import com.privod.platform.modules.russianDoc.repository.EdoTemplateRepository;
import com.privod.platform.modules.russianDoc.web.dto.CreateEdoTemplateRequest;
import com.privod.platform.modules.russianDoc.web.dto.EdoGeneratedDocumentResponse;
import com.privod.platform.modules.russianDoc.web.dto.EdoTemplateResponse;
import com.privod.platform.modules.russianDoc.web.dto.GenerateEdoDocumentRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service("russianDocEdoService")
@RequiredArgsConstructor
@Slf4j
public class EdoService {

    private final EdoTemplateRepository templateRepository;
    private final EdoGeneratedDocumentRepository generatedDocRepository;
    private final AuditService auditService;

    // ============================
    // Templates
    // ============================

    @Transactional(readOnly = true)
    public Page<EdoTemplateResponse> listTemplates(Pageable pageable) {
        return templateRepository.findByDeletedFalse(pageable)
                .map(EdoTemplateResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public EdoTemplateResponse getTemplate(UUID id) {
        EdoTemplate template = getTemplateOrThrow(id);
        return EdoTemplateResponse.fromEntity(template);
    }

    @Transactional
    public EdoTemplateResponse createTemplate(CreateEdoTemplateRequest request) {
        EdoTemplate template = EdoTemplate.builder()
                .code(request.code())
                .name(request.name())
                .documentType(request.documentType())
                .templateXml(request.templateXml())
                .isActive(true)
                .build();

        template = templateRepository.save(template);
        auditService.logCreate("EdoTemplate", template.getId());

        log.info("Шаблон ЭДО создан: {} ({}) ({})", template.getName(), template.getCode(), template.getId());
        return EdoTemplateResponse.fromEntity(template);
    }

    @Transactional
    public EdoTemplateResponse updateTemplate(UUID id, CreateEdoTemplateRequest request) {
        EdoTemplate template = getTemplateOrThrow(id);

        template.setCode(request.code());
        template.setName(request.name());
        template.setDocumentType(request.documentType());
        template.setTemplateXml(request.templateXml());

        template = templateRepository.save(template);
        auditService.logUpdate("EdoTemplate", template.getId(), "multiple", null, null);

        log.info("Шаблон ЭДО обновлён: {} ({}) ({})", template.getName(), template.getCode(), template.getId());
        return EdoTemplateResponse.fromEntity(template);
    }

    @Transactional
    public void deleteTemplate(UUID id) {
        EdoTemplate template = getTemplateOrThrow(id);
        template.softDelete();
        templateRepository.save(template);
        auditService.logDelete("EdoTemplate", template.getId());

        log.info("Шаблон ЭДО удалён: {} ({})", template.getCode(), template.getId());
    }

    @Transactional(readOnly = true)
    public List<EdoTemplateResponse> getActiveTemplates(String documentType) {
        List<EdoTemplate> templates = documentType != null
                ? templateRepository.findByDocumentTypeAndIsActiveTrueAndDeletedFalse(documentType)
                : templateRepository.findByIsActiveTrueAndDeletedFalse();
        return templates.stream().map(EdoTemplateResponse::fromEntity).toList();
    }

    private EdoTemplate getTemplateOrThrow(UUID id) {
        return templateRepository.findById(id)
                .filter(t -> !t.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Шаблон ЭДО не найден: " + id));
    }

    // ============================
    // Generated Documents
    // ============================

    @Transactional(readOnly = true)
    public Page<EdoGeneratedDocumentResponse> listGeneratedDocuments(Pageable pageable) {
        return generatedDocRepository.findByDeletedFalse(pageable)
                .map(EdoGeneratedDocumentResponse::fromEntity);
    }

    @Transactional
    public EdoGeneratedDocumentResponse generateDocument(GenerateEdoDocumentRequest request) {
        EdoTemplate template = getTemplateOrThrow(request.templateId());

        if (!template.isActive()) {
            throw new IllegalStateException("Шаблон ЭДО неактивен: " + template.getCode());
        }

        // Generate XML from template (simplified - in production would use XSLT or template engine)
        String generatedXml = applyTemplate(template, request.sourceDocumentType(), request.sourceDocumentId());

        EdoGeneratedDocument genDoc = EdoGeneratedDocument.builder()
                .template(template)
                .sourceDocumentType(request.sourceDocumentType())
                .sourceDocumentId(request.sourceDocumentId())
                .generatedXml(generatedXml)
                .status(EdoDocumentStatus.GENERATED)
                .build();

        genDoc = generatedDocRepository.save(genDoc);
        auditService.logCreate("EdoGeneratedDocument", genDoc.getId());

        log.info("ЭДО документ сгенерирован: шаблон {} для {} ({}) ({})",
                template.getCode(), request.sourceDocumentType(), request.sourceDocumentId(), genDoc.getId());
        return EdoGeneratedDocumentResponse.fromEntity(genDoc);
    }

    @Transactional(readOnly = true)
    public List<EdoGeneratedDocumentResponse> getDocumentsBySource(String sourceType, UUID sourceId) {
        return generatedDocRepository
                .findBySourceDocumentTypeAndSourceDocumentIdAndDeletedFalse(sourceType, sourceId)
                .stream()
                .map(EdoGeneratedDocumentResponse::fromEntity)
                .toList();
    }

    private String applyTemplate(EdoTemplate template, String sourceDocumentType, UUID sourceDocumentId) {
        // Simplified template application - in production would use proper XML generation
        return template.getTemplateXml()
                .replace("${documentType}", sourceDocumentType)
                .replace("${documentId}", sourceDocumentId.toString());
    }
}
