package com.privod.platform.modules.russianDoc;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.russianDoc.domain.EdoDocumentStatus;
import com.privod.platform.modules.russianDoc.domain.EdoGeneratedDocument;
import com.privod.platform.modules.russianDoc.domain.EdoTemplate;
import com.privod.platform.modules.russianDoc.repository.EdoGeneratedDocumentRepository;
import com.privod.platform.modules.russianDoc.repository.EdoTemplateRepository;
import com.privod.platform.modules.russianDoc.service.EdoService;
import com.privod.platform.modules.russianDoc.web.dto.CreateEdoTemplateRequest;
import com.privod.platform.modules.russianDoc.web.dto.EdoGeneratedDocumentResponse;
import com.privod.platform.modules.russianDoc.web.dto.EdoTemplateResponse;
import com.privod.platform.modules.russianDoc.web.dto.GenerateEdoDocumentRequest;
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
import java.util.List;
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
    private EdoTemplateRepository templateRepository;
    @Mock
    private EdoGeneratedDocumentRepository generatedDocRepository;
    @Mock
    private AuditService auditService;

    @InjectMocks
    private EdoService edoService;

    private UUID templateId;
    private EdoTemplate testTemplate;

    @BeforeEach
    void setUp() {
        templateId = UUID.randomUUID();

        testTemplate = EdoTemplate.builder()
                .code("UPD_V5")
                .name("Шаблон УПД v5.01")
                .documentType("UPD")
                .templateXml("<Файл><Документ type=\"${documentType}\" id=\"${documentId}\"/></Файл>")
                .isActive(true)
                .build();
        testTemplate.setId(templateId);
        testTemplate.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Template")
    class CreateTemplateTests {

        @Test
        @DisplayName("Should create EDO template")
        void createTemplate_Success() {
            CreateEdoTemplateRequest request = new CreateEdoTemplateRequest(
                    "UKD_V5", "Шаблон УКД v5.02", "UKD", "<Файл/>");

            when(templateRepository.save(any(EdoTemplate.class))).thenAnswer(inv -> {
                EdoTemplate t = inv.getArgument(0);
                t.setId(UUID.randomUUID());
                t.setCreatedAt(Instant.now());
                return t;
            });

            EdoTemplateResponse response = edoService.createTemplate(request);

            assertThat(response.code()).isEqualTo("UKD_V5");
            assertThat(response.name()).isEqualTo("Шаблон УКД v5.02");
            assertThat(response.active()).isTrue();
            verify(auditService).logCreate(eq("EdoTemplate"), any(UUID.class));
        }
    }

    @Nested
    @DisplayName("Generate Document")
    class GenerateDocumentTests {

        @Test
        @DisplayName("Should generate EDO document from template")
        void generateDocument_Success() {
            UUID sourceDocId = UUID.randomUUID();
            when(templateRepository.findById(templateId)).thenReturn(Optional.of(testTemplate));
            when(generatedDocRepository.save(any(EdoGeneratedDocument.class))).thenAnswer(inv -> {
                EdoGeneratedDocument d = inv.getArgument(0);
                d.setId(UUID.randomUUID());
                d.setCreatedAt(Instant.now());
                return d;
            });

            GenerateEdoDocumentRequest request = new GenerateEdoDocumentRequest(
                    templateId, "UPD", sourceDocId);

            EdoGeneratedDocumentResponse response = edoService.generateDocument(request);

            assertThat(response.status()).isEqualTo(EdoDocumentStatus.GENERATED);
            assertThat(response.templateId()).isEqualTo(templateId);
            assertThat(response.sourceDocumentType()).isEqualTo("UPD");
            assertThat(response.generatedXml()).contains(sourceDocId.toString());
            verify(auditService).logCreate(eq("EdoGeneratedDocument"), any(UUID.class));
        }

        @Test
        @DisplayName("Should throw when template is inactive")
        void generateDocument_ThrowsForInactiveTemplate() {
            testTemplate.setActive(false);
            when(templateRepository.findById(templateId)).thenReturn(Optional.of(testTemplate));

            GenerateEdoDocumentRequest request = new GenerateEdoDocumentRequest(
                    templateId, "UPD", UUID.randomUUID());

            assertThatThrownBy(() -> edoService.generateDocument(request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("неактивен");
        }

        @Test
        @DisplayName("Should throw when template not found")
        void generateDocument_ThrowsForMissingTemplate() {
            UUID nonExistentId = UUID.randomUUID();
            when(templateRepository.findById(nonExistentId)).thenReturn(Optional.empty());

            GenerateEdoDocumentRequest request = new GenerateEdoDocumentRequest(
                    nonExistentId, "UPD", UUID.randomUUID());

            assertThatThrownBy(() -> edoService.generateDocument(request))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Шаблон ЭДО не найден");
        }
    }

    @Nested
    @DisplayName("Active Templates")
    class ActiveTemplatesTests {

        @Test
        @DisplayName("Should return active templates by document type")
        void getActiveTemplates_ByType() {
            when(templateRepository.findByDocumentTypeAndIsActiveTrueAndDeletedFalse("UPD"))
                    .thenReturn(List.of(testTemplate));

            List<EdoTemplateResponse> result = edoService.getActiveTemplates("UPD");

            assertThat(result).hasSize(1);
            assertThat(result.get(0).documentType()).isEqualTo("UPD");
        }

        @Test
        @DisplayName("Should return all active templates when type is null")
        void getActiveTemplates_AllTypes() {
            when(templateRepository.findByIsActiveTrueAndDeletedFalse())
                    .thenReturn(List.of(testTemplate));

            List<EdoTemplateResponse> result = edoService.getActiveTemplates(null);

            assertThat(result).hasSize(1);
        }
    }
}
