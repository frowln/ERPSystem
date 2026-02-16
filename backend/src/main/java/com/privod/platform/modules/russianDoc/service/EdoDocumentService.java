package com.privod.platform.modules.russianDoc.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.russianDoc.domain.EdoAction;
import com.privod.platform.modules.russianDoc.domain.EdoDocument;
import com.privod.platform.modules.russianDoc.domain.EdoEnhancedDocumentStatus;
import com.privod.platform.modules.russianDoc.domain.EdoExchangeLog;
import com.privod.platform.modules.russianDoc.domain.EdoSignature;
import com.privod.platform.modules.russianDoc.repository.EdoDocumentRepository;
import com.privod.platform.modules.russianDoc.repository.EdoExchangeLogRepository;
import com.privod.platform.modules.russianDoc.repository.EdoSignatureRepository;
import com.privod.platform.modules.russianDoc.web.dto.CreateEdoDocumentRequest;
import com.privod.platform.modules.russianDoc.web.dto.CreateEdoSignatureRequest;
import com.privod.platform.modules.russianDoc.web.dto.EdoDocumentResponse;
import com.privod.platform.modules.russianDoc.web.dto.EdoExchangeLogResponse;
import com.privod.platform.modules.russianDoc.web.dto.EdoSignatureResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class EdoDocumentService {

    private final EdoDocumentRepository documentRepository;
    private final EdoSignatureRepository signatureRepository;
    private final EdoExchangeLogRepository exchangeLogRepository;
    private final AuditService auditService;

    // === Document CRUD ===

    @Transactional(readOnly = true)
    public Page<EdoDocumentResponse> listDocuments(Pageable pageable) {
        return documentRepository.findByDeletedFalse(pageable)
                .map(EdoDocumentResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public EdoDocumentResponse getDocument(UUID id) {
        EdoDocument document = getDocumentOrThrow(id);
        return EdoDocumentResponse.fromEntity(document);
    }

    @Transactional
    public EdoDocumentResponse createDocument(CreateEdoDocumentRequest request) {
        EdoDocument document = EdoDocument.builder()
                .documentNumber(request.documentNumber())
                .documentDate(request.documentDate())
                .documentType(request.documentType())
                .senderId(request.senderId())
                .senderInn(request.senderInn())
                .receiverId(request.receiverId())
                .receiverInn(request.receiverInn())
                .status(EdoEnhancedDocumentStatus.CREATED)
                .amount(request.amount())
                .vatAmount(request.vatAmount())
                .totalAmount(request.totalAmount())
                .linkedDocumentId(request.linkedDocumentId())
                .linkedDocumentModel(request.linkedDocumentModel())
                .fileUrl(request.fileUrl())
                .xmlData(request.xmlData())
                .build();

        document = documentRepository.save(document);
        auditService.logCreate("EdoDocument", document.getId());

        logExchangeAction(document.getId(), EdoAction.CREATED, null, "Документ ЭДО создан");

        log.info("Документ ЭДО создан: {} {} ({})",
                document.getDocumentType().getDisplayName(), document.getDocumentNumber(), document.getId());
        return EdoDocumentResponse.fromEntity(document);
    }

    @Transactional
    public EdoDocumentResponse updateDocument(UUID id, CreateEdoDocumentRequest request) {
        EdoDocument document = getDocumentOrThrow(id);

        if (document.getStatus() != EdoEnhancedDocumentStatus.CREATED) {
            throw new IllegalStateException(
                    "Невозможно изменить документ в статусе '" + document.getStatus().getDisplayName() + "'");
        }

        document.setDocumentNumber(request.documentNumber());
        document.setDocumentDate(request.documentDate());
        document.setDocumentType(request.documentType());
        document.setSenderId(request.senderId());
        document.setSenderInn(request.senderInn());
        document.setReceiverId(request.receiverId());
        document.setReceiverInn(request.receiverInn());
        document.setAmount(request.amount());
        document.setVatAmount(request.vatAmount());
        document.setTotalAmount(request.totalAmount());
        document.setLinkedDocumentId(request.linkedDocumentId());
        document.setLinkedDocumentModel(request.linkedDocumentModel());
        document.setFileUrl(request.fileUrl());
        document.setXmlData(request.xmlData());

        document = documentRepository.save(document);
        auditService.logUpdate("EdoDocument", document.getId(), "document", null, null);

        log.info("Документ ЭДО обновлён: {} {} ({})",
                document.getDocumentType().getDisplayName(), document.getDocumentNumber(), document.getId());
        return EdoDocumentResponse.fromEntity(document);
    }

    @Transactional
    public void deleteDocument(UUID id) {
        EdoDocument document = getDocumentOrThrow(id);
        document.softDelete();
        documentRepository.save(document);
        auditService.logDelete("EdoDocument", id);
        log.info("Документ ЭДО удалён: {}", id);
    }

    // === Status management ===

    @Transactional
    public EdoDocumentResponse signBySender(UUID id, UUID signerId) {
        EdoDocument document = getDocumentOrThrow(id);
        return transitionStatus(document, EdoEnhancedDocumentStatus.SIGNED_BY_SENDER,
                EdoAction.SIGNED, signerId, "Подписан отправителем");
    }

    @Transactional
    public EdoDocumentResponse sendDocument(UUID id) {
        EdoDocument document = getDocumentOrThrow(id);
        return transitionStatus(document, EdoEnhancedDocumentStatus.SENT,
                EdoAction.SENT, null, "Документ отправлен");
    }

    @Transactional
    public EdoDocumentResponse markDelivered(UUID id) {
        EdoDocument document = getDocumentOrThrow(id);
        return transitionStatus(document, EdoEnhancedDocumentStatus.DELIVERED,
                EdoAction.RECEIVED, null, "Документ доставлен");
    }

    @Transactional
    public EdoDocumentResponse signByReceiver(UUID id, UUID signerId) {
        EdoDocument document = getDocumentOrThrow(id);
        return transitionStatus(document, EdoEnhancedDocumentStatus.SIGNED_BY_RECEIVER,
                EdoAction.ACCEPTED, signerId, "Подписан получателем");
    }

    @Transactional
    public EdoDocumentResponse rejectDocument(UUID id, String reason) {
        EdoDocument document = getDocumentOrThrow(id);
        return transitionStatus(document, EdoEnhancedDocumentStatus.REJECTED,
                EdoAction.REJECTED, null, "Отклонён: " + reason);
    }

    @Transactional
    public EdoDocumentResponse cancelDocument(UUID id) {
        EdoDocument document = getDocumentOrThrow(id);
        return transitionStatus(document, EdoEnhancedDocumentStatus.CANCELLED,
                null, null, "Документ аннулирован");
    }

    // === Signatures ===

    @Transactional(readOnly = true)
    public List<EdoSignatureResponse> getSignatures(UUID edoDocumentId) {
        return signatureRepository.findByEdoDocumentIdAndDeletedFalse(edoDocumentId)
                .stream()
                .map(EdoSignatureResponse::fromEntity)
                .toList();
    }

    @Transactional
    public EdoSignatureResponse addSignature(CreateEdoSignatureRequest request) {
        getDocumentOrThrow(request.edoDocumentId());

        EdoSignature signature = EdoSignature.builder()
                .edoDocumentId(request.edoDocumentId())
                .signerId(request.signerId())
                .signerName(request.signerName())
                .signerPosition(request.signerPosition())
                .certificateSerialNumber(request.certificateSerialNumber())
                .signedAt(Instant.now())
                .signatureData(request.signatureData())
                .isValid(true)
                .build();

        signature = signatureRepository.save(signature);
        auditService.logCreate("EdoSignature", signature.getId());

        log.info("Подпись ЭДО добавлена: документ {} подписант {}",
                request.edoDocumentId(), request.signerName());
        return EdoSignatureResponse.fromEntity(signature);
    }

    // === Exchange log ===

    @Transactional(readOnly = true)
    public List<EdoExchangeLogResponse> getDocumentHistory(UUID edoDocumentId) {
        return exchangeLogRepository.findByEdoDocumentIdAndDeletedFalseOrderByPerformedAtDesc(edoDocumentId)
                .stream()
                .map(EdoExchangeLogResponse::fromEntity)
                .toList();
    }

    // === Private helpers ===

    private EdoDocumentResponse transitionStatus(EdoDocument document, EdoEnhancedDocumentStatus newStatus,
                                                  EdoAction action, UUID performedById, String details) {
        if (!document.canTransitionTo(newStatus)) {
            throw new IllegalStateException(
                    String.format("Невозможно перевести документ из статуса '%s' в '%s'",
                            document.getStatus().getDisplayName(), newStatus.getDisplayName()));
        }

        EdoEnhancedDocumentStatus oldStatus = document.getStatus();
        document.setStatus(newStatus);
        document = documentRepository.save(document);

        auditService.logStatusChange("EdoDocument", document.getId(), oldStatus.name(), newStatus.name());

        if (action != null) {
            logExchangeAction(document.getId(), action, performedById, details);
        }

        log.info("Документ ЭДО {} -> {}: {} ({})",
                oldStatus.getDisplayName(), newStatus.getDisplayName(),
                document.getDocumentNumber(), document.getId());
        return EdoDocumentResponse.fromEntity(document);
    }

    private void logExchangeAction(UUID edoDocumentId, EdoAction action, UUID performedById, String details) {
        EdoExchangeLog exchangeLog = EdoExchangeLog.builder()
                .edoDocumentId(edoDocumentId)
                .action(action)
                .performedById(performedById)
                .performedAt(Instant.now())
                .details(details)
                .build();

        exchangeLogRepository.save(exchangeLog);
    }

    private EdoDocument getDocumentOrThrow(UUID id) {
        return documentRepository.findById(id)
                .filter(d -> !d.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Документ ЭДО не найден: " + id));
    }
}
