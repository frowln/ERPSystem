package com.privod.platform.modules.integration;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.integration.domain.SbisConfig;
import com.privod.platform.modules.integration.domain.SbisDirection;
import com.privod.platform.modules.integration.domain.SbisDocument;
import com.privod.platform.modules.integration.domain.SbisDocumentStatus;
import com.privod.platform.modules.integration.domain.SbisDocumentType;
import com.privod.platform.modules.integration.domain.SbisPartnerMapping;
import com.privod.platform.modules.integration.repository.SbisConfigRepository;
import com.privod.platform.modules.integration.repository.SbisDocumentRepository;
import com.privod.platform.modules.integration.repository.SbisPartnerMappingRepository;
import com.privod.platform.modules.integration.service.SbisService;
import com.privod.platform.modules.integration.web.dto.CreateSbisConfigRequest;
import com.privod.platform.modules.integration.web.dto.CreateSbisDocumentRequest;
import com.privod.platform.modules.integration.web.dto.SbisConfigResponse;
import com.privod.platform.modules.integration.web.dto.SbisDocumentResponse;
import com.privod.platform.modules.integration.web.dto.SbisPartnerMappingResponse;
import jakarta.persistence.EntityNotFoundException;
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
class SbisServiceTest {

    @Mock
    private SbisConfigRepository configRepository;

    @Mock
    private SbisDocumentRepository documentRepository;

    @Mock
    private SbisPartnerMappingRepository partnerMappingRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private SbisService sbisService;

    private UUID configId;
    private UUID documentId;
    private SbisConfig testConfig;
    private SbisDocument testDocument;

    @BeforeEach
    void setUp() {
        configId = UUID.randomUUID();
        documentId = UUID.randomUUID();

        testConfig = SbisConfig.builder()
                .name("СБИС Основная")
                .apiUrl("https://api.sbis.ru")
                .login("user@company.ru")
                .password("secret")
                .certificateThumbprint("ABCDEF1234567890")
                .organizationInn("7701234567")
                .organizationKpp("770101001")
                .isActive(true)
                .autoSend(false)
                .build();
        testConfig.setId(configId);
        testConfig.setCreatedAt(Instant.now());

        testDocument = SbisDocument.builder()
                .documentType(SbisDocumentType.UPD)
                .internalDocumentId(UUID.randomUUID())
                .internalDocumentModel("Invoice")
                .partnerInn("7707654321")
                .partnerKpp("770701001")
                .partnerName("ООО Партнёр")
                .direction(SbisDirection.OUTGOING)
                .status(SbisDocumentStatus.DRAFT)
                .build();
        testDocument.setId(documentId);
        testDocument.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Config")
    class CreateConfigTests {

        @Test
        @DisplayName("Should create SBIS config with isActive = true")
        void createConfig_SetsActiveTrue() {
            CreateSbisConfigRequest request = new CreateSbisConfigRequest(
                    "СБИС Тест", "https://api.sbis.ru/test", "test@co.ru", "pass",
                    "THUMB123", "7701111111", "770101001", true
            );

            when(configRepository.existsByNameAndDeletedFalse("СБИС Тест")).thenReturn(false);
            when(configRepository.save(any(SbisConfig.class))).thenAnswer(inv -> {
                SbisConfig config = inv.getArgument(0);
                config.setId(UUID.randomUUID());
                config.setCreatedAt(Instant.now());
                return config;
            });

            SbisConfigResponse response = sbisService.createConfig(request);

            assertThat(response.isActive()).isTrue();
            assertThat(response.name()).isEqualTo("СБИС Тест");
            assertThat(response.organizationInn()).isEqualTo("7701111111");
            verify(auditService).logCreate(eq("SbisConfig"), any(UUID.class));
        }

        @Test
        @DisplayName("Should throw when config name already exists")
        void createConfig_DuplicateName_Throws() {
            CreateSbisConfigRequest request = new CreateSbisConfigRequest(
                    "СБИС Основная", "https://api.sbis.ru", "user", "pass",
                    null, "7701234567", null, false
            );

            when(configRepository.existsByNameAndDeletedFalse("СБИС Основная")).thenReturn(true);

            assertThatThrownBy(() -> sbisService.createConfig(request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("уже существует");
        }
    }

    @Nested
    @DisplayName("Create Document")
    class CreateDocumentTests {

        @Test
        @DisplayName("Should create document with DRAFT status")
        void createDocument_SetsDraftStatus() {
            CreateSbisDocumentRequest request = new CreateSbisDocumentRequest(
                    SbisDocumentType.TORG12, UUID.randomUUID(), "DeliveryNote",
                    "7707654321", "770701001", "ООО Склад",
                    SbisDirection.OUTGOING, "{\"items\":[]}");

            when(documentRepository.save(any(SbisDocument.class))).thenAnswer(inv -> {
                SbisDocument doc = inv.getArgument(0);
                doc.setId(UUID.randomUUID());
                doc.setCreatedAt(Instant.now());
                return doc;
            });

            SbisDocumentResponse response = sbisService.createDocument(request);

            assertThat(response.status()).isEqualTo(SbisDocumentStatus.DRAFT);
            assertThat(response.documentType()).isEqualTo(SbisDocumentType.TORG12);
            assertThat(response.partnerName()).isEqualTo("ООО Склад");
            assertThat(response.direction()).isEqualTo(SbisDirection.OUTGOING);
            verify(auditService).logCreate(eq("SbisDocument"), any(UUID.class));
        }
    }

    @Nested
    @DisplayName("Send Document")
    class SendDocumentTests {

        @Test
        @DisplayName("Should send DRAFT document and set sentAt")
        void sendDocument_FromDraft_Success() {
            when(documentRepository.findById(documentId)).thenReturn(Optional.of(testDocument));
            when(documentRepository.save(any(SbisDocument.class))).thenAnswer(inv -> inv.getArgument(0));

            SbisDocumentResponse response = sbisService.sendDocument(documentId);

            assertThat(response.status()).isEqualTo(SbisDocumentStatus.SENT);
            assertThat(response.sentAt()).isNotNull();
            verify(auditService).logStatusChange("SbisDocument", documentId, "DRAFT", "SENT");
        }

        @Test
        @DisplayName("Should throw when sending from invalid status")
        void sendDocument_FromAccepted_Throws() {
            testDocument.setStatus(SbisDocumentStatus.ACCEPTED);
            when(documentRepository.findById(documentId)).thenReturn(Optional.of(testDocument));

            assertThatThrownBy(() -> sbisService.sendDocument(documentId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно отправить");
        }
    }

    @Nested
    @DisplayName("Accept Document")
    class AcceptDocumentTests {

        @Test
        @DisplayName("Should accept DELIVERED document and set signedAt")
        void acceptDocument_FromDelivered_Success() {
            testDocument.setStatus(SbisDocumentStatus.DELIVERED);
            when(documentRepository.findById(documentId)).thenReturn(Optional.of(testDocument));
            when(documentRepository.save(any(SbisDocument.class))).thenAnswer(inv -> inv.getArgument(0));

            SbisDocumentResponse response = sbisService.acceptDocument(documentId);

            assertThat(response.status()).isEqualTo(SbisDocumentStatus.ACCEPTED);
            assertThat(response.signedAt()).isNotNull();
            verify(auditService).logStatusChange("SbisDocument", documentId, "DELIVERED", "ACCEPTED");
        }
    }

    @Nested
    @DisplayName("Reject Document")
    class RejectDocumentTests {

        @Test
        @DisplayName("Should reject DELIVERED document with error message")
        void rejectDocument_FromDelivered_Success() {
            testDocument.setStatus(SbisDocumentStatus.DELIVERED);
            when(documentRepository.findById(documentId)).thenReturn(Optional.of(testDocument));
            when(documentRepository.save(any(SbisDocument.class))).thenAnswer(inv -> inv.getArgument(0));

            SbisDocumentResponse response = sbisService.rejectDocument(documentId, "Неверные реквизиты");

            assertThat(response.status()).isEqualTo(SbisDocumentStatus.REJECTED);
            assertThat(response.errorMessage()).isEqualTo("Неверные реквизиты");
            verify(auditService).logStatusChange("SbisDocument", documentId, "DELIVERED", "REJECTED");
        }

        @Test
        @DisplayName("Should throw when rejecting from DRAFT status")
        void rejectDocument_FromDraft_Throws() {
            when(documentRepository.findById(documentId)).thenReturn(Optional.of(testDocument));

            assertThatThrownBy(() -> sbisService.rejectDocument(documentId, "Ошибка"))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно отклонить");
        }
    }

    @Nested
    @DisplayName("Create Partner Mapping")
    class CreatePartnerMappingTests {

        @Test
        @DisplayName("Should create partner mapping with isActive = true")
        void createPartnerMapping_Success() {
            UUID partnerId = UUID.randomUUID();
            when(partnerMappingRepository.findByPartnerIdAndDeletedFalse(partnerId))
                    .thenReturn(Optional.empty());
            when(partnerMappingRepository.save(any(SbisPartnerMapping.class))).thenAnswer(inv -> {
                SbisPartnerMapping m = inv.getArgument(0);
                m.setId(UUID.randomUUID());
                m.setCreatedAt(Instant.now());
                return m;
            });

            SbisPartnerMappingResponse response = sbisService.createPartnerMapping(
                    partnerId, "ООО Поставщик", "SBIS-001", "7708888888", "770801001");

            assertThat(response.partnerName()).isEqualTo("ООО Поставщик");
            assertThat(response.sbisContractorInn()).isEqualTo("7708888888");
            assertThat(response.isActive()).isTrue();
            verify(auditService).logCreate(eq("SbisPartnerMapping"), any(UUID.class));
        }

        @Test
        @DisplayName("Should throw when partner mapping already exists")
        void createPartnerMapping_Duplicate_Throws() {
            UUID partnerId = UUID.randomUUID();
            SbisPartnerMapping existing = SbisPartnerMapping.builder()
                    .partnerId(partnerId)
                    .partnerName("Existing")
                    .build();
            existing.setId(UUID.randomUUID());

            when(partnerMappingRepository.findByPartnerIdAndDeletedFalse(partnerId))
                    .thenReturn(Optional.of(existing));

            assertThatThrownBy(() -> sbisService.createPartnerMapping(
                    partnerId, "ООО Новый", "SBIS-002", "7701111111", null))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("уже существует");
        }
    }

    @Nested
    @DisplayName("Get Document - Not Found")
    class GetDocumentTests {

        @Test
        @DisplayName("Should throw when document not found")
        void getDocument_NotFound_Throws() {
            UUID nonExistentId = UUID.randomUUID();
            when(documentRepository.findById(nonExistentId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> sbisService.getDocument(nonExistentId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Документ СБИС не найден");
        }
    }
}
