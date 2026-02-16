package com.privod.platform.modules.integration;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.integration.domain.EdoDocumentType;
import com.privod.platform.modules.integration.domain.EdoProvider;
import com.privod.platform.modules.integration.domain.ExternalDocument;
import com.privod.platform.modules.integration.domain.ExternalDocumentStatus;
import com.privod.platform.modules.integration.domain.SignatureStatus;
import com.privod.platform.modules.integration.repository.ExternalDocumentRepository;
import com.privod.platform.modules.integration.service.EdoService;
import com.privod.platform.modules.integration.web.dto.ExternalDocumentResponse;
import com.privod.platform.modules.integration.web.dto.RejectDocumentRequest;
import com.privod.platform.modules.integration.web.dto.SendEdoDocumentRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EdoServiceTest {

    @Mock
    private ExternalDocumentRepository documentRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private EdoService edoService;

    private UUID documentId;
    private ExternalDocument testDocument;

    @BeforeEach
    void setUp() {
        documentId = UUID.randomUUID();
        testDocument = ExternalDocument.builder()
                .externalId("EXT-001")
                .provider(EdoProvider.DIADOC)
                .documentType(EdoDocumentType.UPD)
                .title("УПД от 01.01.2025")
                .senderInn("7707083893")
                .senderName("ООО Поставщик")
                .recipientInn("7736050003")
                .recipientName("ООО Подрядчик")
                .status(ExternalDocumentStatus.RECEIVED)
                .signatureStatus(SignatureStatus.UNSIGNED)
                .fileUrl("https://diadoc.ru/files/upd-001.xml")
                .receivedAt(Instant.now())
                .build();
        testDocument.setId(documentId);
        testDocument.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Отправка документа")
    class SendDocumentTests {

        @Test
        @DisplayName("Должен отправить документ ЭДО")
        void send_Success() {
            when(documentRepository.save(any(ExternalDocument.class))).thenAnswer(inv -> {
                ExternalDocument d = inv.getArgument(0);
                d.setId(UUID.randomUUID());
                d.setCreatedAt(Instant.now());
                return d;
            });

            SendEdoDocumentRequest request = new SendEdoDocumentRequest(
                    EdoProvider.DIADOC, EdoDocumentType.UPD, "УПД тест",
                    "7707083893", "ООО Тест",
                    "https://example.com/file.xml",
                    "contract", UUID.randomUUID()
            );

            ExternalDocumentResponse response = edoService.sendDocument(request);

            assertThat(response.provider()).isEqualTo(EdoProvider.DIADOC);
            assertThat(response.providerDisplayName()).isEqualTo("Диадок");
            assertThat(response.documentType()).isEqualTo(EdoDocumentType.UPD);
            assertThat(response.documentTypeDisplayName()).isEqualTo("УПД");
            assertThat(response.status()).isEqualTo(ExternalDocumentStatus.RECEIVED);
            assertThat(response.signatureStatus()).isEqualTo(SignatureStatus.UNSIGNED);
            verify(auditService).logCreate(eq("ExternalDocument"), any(UUID.class));
        }
    }

    @Nested
    @DisplayName("Подписание документа")
    class SignDocumentTests {

        @Test
        @DisplayName("Должен подписать полученный документ")
        void sign_Success() {
            when(documentRepository.findById(documentId)).thenReturn(Optional.of(testDocument));
            when(documentRepository.save(any(ExternalDocument.class))).thenReturn(testDocument);

            ExternalDocumentResponse response = edoService.signDocument(documentId);

            assertThat(response).isNotNull();
            verify(auditService).logStatusChange("ExternalDocument", documentId,
                    ExternalDocumentStatus.RECEIVED.name(), ExternalDocumentStatus.SIGNED.name());
        }

        @Test
        @DisplayName("Должен отклонить повторное подписание")
        void sign_AlreadySigned() {
            testDocument.setStatus(ExternalDocumentStatus.SIGNED);
            when(documentRepository.findById(documentId)).thenReturn(Optional.of(testDocument));

            assertThatThrownBy(() -> edoService.signDocument(documentId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("уже подписан");
        }

        @Test
        @DisplayName("Должен отклонить подписание отклонённого документа")
        void sign_Rejected() {
            testDocument.setStatus(ExternalDocumentStatus.REJECTED);
            when(documentRepository.findById(documentId)).thenReturn(Optional.of(testDocument));

            assertThatThrownBy(() -> edoService.signDocument(documentId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно подписать");
        }
    }

    @Nested
    @DisplayName("Отклонение документа")
    class RejectDocumentTests {

        @Test
        @DisplayName("Должен отклонить полученный документ")
        void reject_Success() {
            when(documentRepository.findById(documentId)).thenReturn(Optional.of(testDocument));
            when(documentRepository.save(any(ExternalDocument.class))).thenReturn(testDocument);

            RejectDocumentRequest request = new RejectDocumentRequest("Неверные реквизиты");

            ExternalDocumentResponse response = edoService.rejectDocument(documentId, request);

            assertThat(response).isNotNull();
            verify(auditService).logStatusChange("ExternalDocument", documentId,
                    ExternalDocumentStatus.RECEIVED.name(), ExternalDocumentStatus.REJECTED.name());
        }

        @Test
        @DisplayName("Должен отклонить отклонение подписанного документа")
        void reject_AlreadySigned() {
            testDocument.setStatus(ExternalDocumentStatus.SIGNED);
            when(documentRepository.findById(documentId)).thenReturn(Optional.of(testDocument));

            RejectDocumentRequest request = new RejectDocumentRequest("Причина");

            assertThatThrownBy(() -> edoService.rejectDocument(documentId, request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("подписанный");
        }
    }

    @Test
    @DisplayName("Должен вернуть URL подписанного файла")
    void downloadDocument_SignedFile() {
        testDocument.setSignatureStatus(SignatureStatus.FULLY_SIGNED);
        testDocument.setSignedFileUrl("https://diadoc.ru/files/upd-001-signed.xml");
        when(documentRepository.findById(documentId)).thenReturn(Optional.of(testDocument));

        String url = edoService.downloadDocument(documentId);

        assertThat(url).isEqualTo("https://diadoc.ru/files/upd-001-signed.xml");
    }

    @Test
    @DisplayName("Должен вернуть URL обычного файла если не подписан")
    void downloadDocument_UnsignedFile() {
        when(documentRepository.findById(documentId)).thenReturn(Optional.of(testDocument));

        String url = edoService.downloadDocument(documentId);

        assertThat(url).isEqualTo("https://diadoc.ru/files/upd-001.xml");
    }
}
