package com.privod.platform.modules.russianDoc;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.russianDoc.domain.EdoDocument;
import com.privod.platform.modules.russianDoc.domain.EdoEnhancedDocumentStatus;
import com.privod.platform.modules.russianDoc.domain.EdoEnhancedDocumentType;
import com.privod.platform.modules.russianDoc.domain.EdoExchangeLog;
import com.privod.platform.modules.russianDoc.domain.EdoSignature;
import com.privod.platform.modules.russianDoc.repository.EdoDocumentRepository;
import com.privod.platform.modules.russianDoc.repository.EdoExchangeLogRepository;
import com.privod.platform.modules.russianDoc.repository.EdoSignatureRepository;
import com.privod.platform.modules.russianDoc.service.EdoDocumentService;
import com.privod.platform.modules.russianDoc.web.dto.CreateEdoDocumentRequest;
import com.privod.platform.modules.russianDoc.web.dto.CreateEdoSignatureRequest;
import com.privod.platform.modules.russianDoc.web.dto.EdoDocumentResponse;
import com.privod.platform.modules.russianDoc.web.dto.EdoSignatureResponse;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EdoDocumentServiceTest {

    @Mock
    private EdoDocumentRepository documentRepository;

    @Mock
    private EdoSignatureRepository signatureRepository;

    @Mock
    private EdoExchangeLogRepository exchangeLogRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private EdoDocumentService edoDocumentService;

    private UUID documentId;
    private EdoDocument testDocument;

    @BeforeEach
    void setUp() {
        documentId = UUID.randomUUID();

        testDocument = EdoDocument.builder()
                .documentNumber("УПД-001")
                .documentDate(LocalDate.of(2025, 6, 15))
                .documentType(EdoEnhancedDocumentType.UPD)
                .senderId(UUID.randomUUID())
                .senderInn("7701234567")
                .receiverId(UUID.randomUUID())
                .receiverInn("7707654321")
                .status(EdoEnhancedDocumentStatus.CREATED)
                .amount(new BigDecimal("100000.00"))
                .vatAmount(new BigDecimal("20000.00"))
                .totalAmount(new BigDecimal("120000.00"))
                .build();
        testDocument.setId(documentId);
        testDocument.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Document")
    class CreateDocumentTests {

        @Test
        @DisplayName("Should create EDO document with CREATED status")
        void createDocument_SetsCreatedStatus() {
            CreateEdoDocumentRequest request = new CreateEdoDocumentRequest(
                    "КС2-001", LocalDate.of(2025, 7, 1), EdoEnhancedDocumentType.KS2,
                    UUID.randomUUID(), "7701111111", UUID.randomUUID(), "7702222222",
                    new BigDecimal("500000.00"), new BigDecimal("100000.00"),
                    new BigDecimal("600000.00"), null, null, null, null
            );

            when(documentRepository.save(any(EdoDocument.class))).thenAnswer(inv -> {
                EdoDocument doc = inv.getArgument(0);
                doc.setId(UUID.randomUUID());
                doc.setCreatedAt(Instant.now());
                return doc;
            });
            when(exchangeLogRepository.save(any(EdoExchangeLog.class))).thenAnswer(inv -> {
                EdoExchangeLog log = inv.getArgument(0);
                log.setId(UUID.randomUUID());
                return log;
            });

            EdoDocumentResponse response = edoDocumentService.createDocument(request);

            assertThat(response.status()).isEqualTo(EdoEnhancedDocumentStatus.CREATED);
            assertThat(response.documentType()).isEqualTo(EdoEnhancedDocumentType.KS2);
            assertThat(response.documentNumber()).isEqualTo("КС2-001");
            assertThat(response.totalAmount()).isEqualByComparingTo(new BigDecimal("600000.00"));
            verify(auditService).logCreate(eq("EdoDocument"), any(UUID.class));
        }
    }

    @Nested
    @DisplayName("Sign By Sender")
    class SignBySenderTests {

        @Test
        @DisplayName("Should transition from CREATED to SIGNED_BY_SENDER")
        void signBySender_FromCreated_Success() {
            UUID signerId = UUID.randomUUID();
            when(documentRepository.findById(documentId)).thenReturn(Optional.of(testDocument));
            when(documentRepository.save(any(EdoDocument.class))).thenAnswer(inv -> inv.getArgument(0));
            when(exchangeLogRepository.save(any(EdoExchangeLog.class))).thenAnswer(inv -> {
                EdoExchangeLog log = inv.getArgument(0);
                log.setId(UUID.randomUUID());
                return log;
            });

            EdoDocumentResponse response = edoDocumentService.signBySender(documentId, signerId);

            assertThat(response.status()).isEqualTo(EdoEnhancedDocumentStatus.SIGNED_BY_SENDER);
            verify(auditService).logStatusChange("EdoDocument", documentId,
                    "CREATED", "SIGNED_BY_SENDER");
        }

        @Test
        @DisplayName("Should throw when signing from SENT status")
        void signBySender_FromSent_Throws() {
            testDocument.setStatus(EdoEnhancedDocumentStatus.SENT);
            when(documentRepository.findById(documentId)).thenReturn(Optional.of(testDocument));

            assertThatThrownBy(() -> edoDocumentService.signBySender(documentId, UUID.randomUUID()))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно перевести документ");
        }
    }

    @Nested
    @DisplayName("Send Document")
    class SendDocumentTests {

        @Test
        @DisplayName("Should transition from SIGNED_BY_SENDER to SENT")
        void sendDocument_FromSignedBySender_Success() {
            testDocument.setStatus(EdoEnhancedDocumentStatus.SIGNED_BY_SENDER);
            when(documentRepository.findById(documentId)).thenReturn(Optional.of(testDocument));
            when(documentRepository.save(any(EdoDocument.class))).thenAnswer(inv -> inv.getArgument(0));
            when(exchangeLogRepository.save(any(EdoExchangeLog.class))).thenAnswer(inv -> {
                EdoExchangeLog log = inv.getArgument(0);
                log.setId(UUID.randomUUID());
                return log;
            });

            EdoDocumentResponse response = edoDocumentService.sendDocument(documentId);

            assertThat(response.status()).isEqualTo(EdoEnhancedDocumentStatus.SENT);
            verify(auditService).logStatusChange("EdoDocument", documentId,
                    "SIGNED_BY_SENDER", "SENT");
        }
    }

    @Nested
    @DisplayName("Mark Delivered")
    class MarkDeliveredTests {

        @Test
        @DisplayName("Should transition from SENT to DELIVERED")
        void markDelivered_FromSent_Success() {
            testDocument.setStatus(EdoEnhancedDocumentStatus.SENT);
            when(documentRepository.findById(documentId)).thenReturn(Optional.of(testDocument));
            when(documentRepository.save(any(EdoDocument.class))).thenAnswer(inv -> inv.getArgument(0));
            when(exchangeLogRepository.save(any(EdoExchangeLog.class))).thenAnswer(inv -> {
                EdoExchangeLog log = inv.getArgument(0);
                log.setId(UUID.randomUUID());
                return log;
            });

            EdoDocumentResponse response = edoDocumentService.markDelivered(documentId);

            assertThat(response.status()).isEqualTo(EdoEnhancedDocumentStatus.DELIVERED);
            verify(auditService).logStatusChange("EdoDocument", documentId,
                    "SENT", "DELIVERED");
        }
    }

    @Nested
    @DisplayName("Sign By Receiver")
    class SignByReceiverTests {

        @Test
        @DisplayName("Should transition from DELIVERED to SIGNED_BY_RECEIVER")
        void signByReceiver_FromDelivered_Success() {
            testDocument.setStatus(EdoEnhancedDocumentStatus.DELIVERED);
            UUID signerId = UUID.randomUUID();
            when(documentRepository.findById(documentId)).thenReturn(Optional.of(testDocument));
            when(documentRepository.save(any(EdoDocument.class))).thenAnswer(inv -> inv.getArgument(0));
            when(exchangeLogRepository.save(any(EdoExchangeLog.class))).thenAnswer(inv -> {
                EdoExchangeLog log = inv.getArgument(0);
                log.setId(UUID.randomUUID());
                return log;
            });

            EdoDocumentResponse response = edoDocumentService.signByReceiver(documentId, signerId);

            assertThat(response.status()).isEqualTo(EdoEnhancedDocumentStatus.SIGNED_BY_RECEIVER);
            verify(auditService).logStatusChange("EdoDocument", documentId,
                    "DELIVERED", "SIGNED_BY_RECEIVER");
        }
    }

    @Nested
    @DisplayName("Reject Document")
    class RejectDocumentTests {

        @Test
        @DisplayName("Should transition from DELIVERED to REJECTED with reason")
        void rejectDocument_FromDelivered_Success() {
            testDocument.setStatus(EdoEnhancedDocumentStatus.DELIVERED);
            when(documentRepository.findById(documentId)).thenReturn(Optional.of(testDocument));
            when(documentRepository.save(any(EdoDocument.class))).thenAnswer(inv -> inv.getArgument(0));
            when(exchangeLogRepository.save(any(EdoExchangeLog.class))).thenAnswer(inv -> {
                EdoExchangeLog log = inv.getArgument(0);
                log.setId(UUID.randomUUID());
                return log;
            });

            EdoDocumentResponse response = edoDocumentService.rejectDocument(documentId, "Несоответствие суммы");

            assertThat(response.status()).isEqualTo(EdoEnhancedDocumentStatus.REJECTED);
            verify(auditService).logStatusChange("EdoDocument", documentId,
                    "DELIVERED", "REJECTED");
        }

        @Test
        @DisplayName("Should throw when rejecting from CREATED status")
        void rejectDocument_FromCreated_Throws() {
            when(documentRepository.findById(documentId)).thenReturn(Optional.of(testDocument));

            assertThatThrownBy(() -> edoDocumentService.rejectDocument(documentId, "Ошибка"))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно перевести документ");
        }
    }

    @Nested
    @DisplayName("Add Signature")
    class AddSignatureTests {

        @Test
        @DisplayName("Should add signature with isValid = true and current timestamp")
        void addSignature_Success() {
            CreateEdoSignatureRequest request = new CreateEdoSignatureRequest(
                    documentId, UUID.randomUUID(), "Иванов И.И.",
                    "Генеральный директор", "SN123456", "base64signature"
            );

            when(documentRepository.findById(documentId)).thenReturn(Optional.of(testDocument));
            when(signatureRepository.save(any(EdoSignature.class))).thenAnswer(inv -> {
                EdoSignature sig = inv.getArgument(0);
                sig.setId(UUID.randomUUID());
                sig.setCreatedAt(Instant.now());
                return sig;
            });

            EdoSignatureResponse response = edoDocumentService.addSignature(request);

            assertThat(response.signerName()).isEqualTo("Иванов И.И.");
            assertThat(response.signerPosition()).isEqualTo("Генеральный директор");
            assertThat(response.isValid()).isTrue();
            assertThat(response.signedAt()).isNotNull();
            verify(auditService).logCreate(eq("EdoSignature"), any(UUID.class));
        }

        @Test
        @DisplayName("Should throw when document not found for signature")
        void addSignature_DocumentNotFound_Throws() {
            UUID nonExistentDocId = UUID.randomUUID();
            CreateEdoSignatureRequest request = new CreateEdoSignatureRequest(
                    nonExistentDocId, UUID.randomUUID(), "Петров П.П.",
                    null, null, "sig"
            );

            when(documentRepository.findById(nonExistentDocId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> edoDocumentService.addSignature(request))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Документ ЭДО не найден");
        }
    }
}
