package com.privod.platform.modules.integration.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.integration.domain.EdoProvider;
import com.privod.platform.modules.integration.domain.ExternalDocument;
import com.privod.platform.modules.integration.domain.ExternalDocumentStatus;
import com.privod.platform.modules.integration.domain.SignatureStatus;
import com.privod.platform.modules.integration.repository.ExternalDocumentRepository;
import com.privod.platform.modules.integration.web.dto.ExternalDocumentResponse;
import com.privod.platform.modules.integration.web.dto.RejectDocumentRequest;
import com.privod.platform.modules.integration.web.dto.SendEdoDocumentRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class EdoIntegrationService {

    private final ExternalDocumentRepository documentRepository;
    private final AuditService auditService;

    @Transactional
    public ExternalDocumentResponse sendDocument(SendEdoDocumentRequest request) {
        ExternalDocument document = ExternalDocument.builder()
                .externalId(UUID.randomUUID().toString())
                .provider(request.provider())
                .documentType(request.documentType())
                .title(request.title())
                .recipientInn(request.recipientInn())
                .recipientName(request.recipientName())
                .fileUrl(request.fileUrl())
                .linkedEntityType(request.linkedEntityType())
                .linkedEntityId(request.linkedEntityId())
                .status(ExternalDocumentStatus.RECEIVED)
                .signatureStatus(SignatureStatus.UNSIGNED)
                .receivedAt(Instant.now())
                .build();

        document = documentRepository.save(document);
        auditService.logCreate("ExternalDocument", document.getId());

        log.info("Документ ЭДО отправлен: {} ({}) через {}",
                document.getTitle(), document.getId(), document.getProvider().getDisplayName());
        return ExternalDocumentResponse.fromEntity(document);
    }

    @Transactional
    public ExternalDocumentResponse signDocument(UUID id) {
        ExternalDocument document = getDocumentOrThrow(id);

        if (document.getStatus() == ExternalDocumentStatus.SIGNED) {
            throw new IllegalStateException("Документ уже подписан");
        }
        if (document.getStatus() == ExternalDocumentStatus.REJECTED ||
                document.getStatus() == ExternalDocumentStatus.CANCELLED) {
            throw new IllegalStateException(
                    "Невозможно подписать документ в статусе '" + document.getStatus().getDisplayName() + "'");
        }

        ExternalDocumentStatus oldStatus = document.getStatus();
        document.setStatus(ExternalDocumentStatus.SIGNED);
        document.setSignatureStatus(SignatureStatus.FULLY_SIGNED);
        document.setSignedAt(Instant.now());

        document = documentRepository.save(document);
        auditService.logStatusChange("ExternalDocument", document.getId(), oldStatus.name(), ExternalDocumentStatus.SIGNED.name());

        log.info("Документ ЭДО подписан: {} ({})", document.getTitle(), document.getId());
        return ExternalDocumentResponse.fromEntity(document);
    }

    @Transactional(readOnly = true)
    public Page<ExternalDocumentResponse> getInboxDocuments(EdoProvider provider, Pageable pageable) {
        if (provider != null) {
            return documentRepository.findByProviderAndDeletedFalse(provider, pageable)
                    .map(ExternalDocumentResponse::fromEntity);
        }
        return documentRepository.findByDeletedFalse(pageable)
                .map(ExternalDocumentResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public ExternalDocumentResponse getDocumentStatus(UUID id) {
        ExternalDocument document = getDocumentOrThrow(id);
        return ExternalDocumentResponse.fromEntity(document);
    }

    @Transactional(readOnly = true)
    public String downloadDocument(UUID id) {
        ExternalDocument document = getDocumentOrThrow(id);

        if (document.getSignatureStatus() == SignatureStatus.FULLY_SIGNED
                && document.getSignedFileUrl() != null) {
            return document.getSignedFileUrl();
        }
        if (document.getFileUrl() != null) {
            return document.getFileUrl();
        }
        throw new IllegalStateException("Файл документа недоступен");
    }

    @Transactional
    public ExternalDocumentResponse rejectDocument(UUID id, RejectDocumentRequest request) {
        ExternalDocument document = getDocumentOrThrow(id);

        if (document.getStatus() == ExternalDocumentStatus.SIGNED) {
            throw new IllegalStateException("Невозможно отклонить подписанный документ");
        }
        if (document.getStatus() == ExternalDocumentStatus.REJECTED) {
            throw new IllegalStateException("Документ уже отклонён");
        }

        ExternalDocumentStatus oldStatus = document.getStatus();
        document.setStatus(ExternalDocumentStatus.REJECTED);

        document = documentRepository.save(document);
        auditService.logStatusChange("ExternalDocument", document.getId(), oldStatus.name(), ExternalDocumentStatus.REJECTED.name());

        log.info("Документ ЭДО отклонён: {} ({}) причина: {}",
                document.getTitle(), document.getId(), request.reason());
        return ExternalDocumentResponse.fromEntity(document);
    }

    @Transactional(readOnly = true)
    public com.privod.platform.modules.integration.web.EdoController.EdoStatusResponse getEdoStatus() {
        long totalDocs = documentRepository.countByDeletedFalse();
        long pendingDocs = documentRepository.countByStatusAndDeletedFalse(ExternalDocumentStatus.RECEIVED);

        ExternalDocument latest = documentRepository.findTopByDeletedFalseOrderByReceivedAtDesc()
                .orElse(null);

        return new com.privod.platform.modules.integration.web.EdoController.EdoStatusResponse(
                true,
                true,
                "DIADOC",
                totalDocs,
                pendingDocs,
                latest != null ? latest.getReceivedAt() : null
        );
    }

    private ExternalDocument getDocumentOrThrow(UUID id) {
        return documentRepository.findById(id)
                .filter(d -> !d.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Документ ЭДО не найден: " + id));
    }
}
