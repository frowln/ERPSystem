package com.privod.platform.modules.russianDoc.web.dto;

import com.privod.platform.modules.russianDoc.domain.EdoDocument;
import com.privod.platform.modules.russianDoc.domain.EdoEnhancedDocumentStatus;
import com.privod.platform.modules.russianDoc.domain.EdoEnhancedDocumentType;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record EdoDocumentResponse(
        UUID id,
        String documentNumber,
        LocalDate documentDate,
        EdoEnhancedDocumentType documentType,
        String documentTypeDisplayName,
        UUID senderId,
        String senderInn,
        UUID receiverId,
        String receiverInn,
        EdoEnhancedDocumentStatus status,
        String statusDisplayName,
        BigDecimal amount,
        BigDecimal vatAmount,
        BigDecimal totalAmount,
        UUID linkedDocumentId,
        String linkedDocumentModel,
        String fileUrl,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static EdoDocumentResponse fromEntity(EdoDocument entity) {
        return new EdoDocumentResponse(
                entity.getId(),
                entity.getDocumentNumber(),
                entity.getDocumentDate(),
                entity.getDocumentType(),
                entity.getDocumentType().getDisplayName(),
                entity.getSenderId(),
                entity.getSenderInn(),
                entity.getReceiverId(),
                entity.getReceiverInn(),
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getAmount(),
                entity.getVatAmount(),
                entity.getTotalAmount(),
                entity.getLinkedDocumentId(),
                entity.getLinkedDocumentModel(),
                entity.getFileUrl(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
