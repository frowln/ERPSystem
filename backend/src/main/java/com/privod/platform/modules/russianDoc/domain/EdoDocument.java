package com.privod.platform.modules.russianDoc.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity(name = "RussianDocEdoDocument")
@Table(name = "edo_documents", indexes = {
        @Index(name = "idx_edo_doc_number", columnList = "document_number"),
        @Index(name = "idx_edo_doc_date", columnList = "document_date"),
        @Index(name = "idx_edo_doc_type", columnList = "document_type"),
        @Index(name = "idx_edo_doc_sender", columnList = "sender_id"),
        @Index(name = "idx_edo_doc_sender_inn", columnList = "sender_inn"),
        @Index(name = "idx_edo_doc_receiver", columnList = "receiver_id"),
        @Index(name = "idx_edo_doc_receiver_inn", columnList = "receiver_inn"),
        @Index(name = "idx_edo_doc_status", columnList = "status"),
        @Index(name = "idx_edo_doc_linked", columnList = "linked_document_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EdoDocument extends BaseEntity {

    @Column(name = "document_number", nullable = false, length = 100)
    private String documentNumber;

    @Column(name = "document_date", nullable = false)
    private LocalDate documentDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "document_type", nullable = false, length = 30)
    private EdoEnhancedDocumentType documentType;

    @Column(name = "sender_id")
    private UUID senderId;

    @Column(name = "sender_inn", length = 12)
    private String senderInn;

    @Column(name = "receiver_id")
    private UUID receiverId;

    @Column(name = "receiver_inn", length = 12)
    private String receiverInn;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private EdoEnhancedDocumentStatus status = EdoEnhancedDocumentStatus.CREATED;

    @Column(name = "amount", precision = 18, scale = 2)
    private BigDecimal amount;

    @Column(name = "vat_amount", precision = 18, scale = 2)
    private BigDecimal vatAmount;

    @Column(name = "total_amount", precision = 18, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "linked_document_id")
    private UUID linkedDocumentId;

    @Column(name = "linked_document_model", length = 100)
    private String linkedDocumentModel;

    @Column(name = "file_url", length = 2000)
    private String fileUrl;

    @Column(name = "xml_data", columnDefinition = "TEXT")
    private String xmlData;

    public boolean canTransitionTo(EdoEnhancedDocumentStatus target) {
        return this.status.canTransitionTo(target);
    }
}
