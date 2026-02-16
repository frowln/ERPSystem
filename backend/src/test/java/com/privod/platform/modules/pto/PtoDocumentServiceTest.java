package com.privod.platform.modules.pto;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.pto.domain.Discipline;
import com.privod.platform.modules.pto.domain.PtoDocument;
import com.privod.platform.modules.pto.domain.PtoDocumentStatus;
import com.privod.platform.modules.pto.domain.PtoDocumentType;
import com.privod.platform.modules.pto.domain.PtoDocumentVersion;
import com.privod.platform.modules.pto.repository.PtoDocumentRepository;
import com.privod.platform.modules.pto.repository.PtoDocumentVersionRepository;
import com.privod.platform.modules.pto.service.PtoCodeGenerator;
import com.privod.platform.modules.pto.service.PtoDocumentService;
import com.privod.platform.modules.pto.web.dto.ChangePtoStatusRequest;
import com.privod.platform.modules.pto.web.dto.CreatePtoDocumentRequest;
import com.privod.platform.modules.pto.web.dto.PtoDocumentResponse;
import com.privod.platform.modules.pto.web.dto.UpdatePtoDocumentRequest;
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
class PtoDocumentServiceTest {

    @Mock
    private PtoDocumentRepository documentRepository;

    @Mock
    private PtoDocumentVersionRepository versionRepository;

    @Mock
    private PtoCodeGenerator codeGenerator;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private PtoDocumentService documentService;

    private UUID documentId;
    private UUID projectId;
    private PtoDocument testDocument;

    @BeforeEach
    void setUp() {
        documentId = UUID.randomUUID();
        projectId = UUID.randomUUID();
        testDocument = PtoDocument.builder()
                .projectId(projectId)
                .code("DOC-20260213-00001")
                .title("Исполнительная схема фундамента")
                .documentType(PtoDocumentType.EXECUTIVE)
                .discipline(Discipline.STRUCTURAL)
                .status(PtoDocumentStatus.DRAFT)
                .currentVersion(1)
                .build();
        testDocument.setId(documentId);
        testDocument.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Document")
    class CreateDocumentTests {

        @Test
        @DisplayName("Should create PTO document with DRAFT status and auto-generated code")
        void createDocument_Success() {
            CreatePtoDocumentRequest request = new CreatePtoDocumentRequest(
                    projectId, "Исполнительная схема фундамента",
                    PtoDocumentType.EXECUTIVE, Discipline.STRUCTURAL, "Примечание");

            when(codeGenerator.generateDocumentCode()).thenReturn("DOC-20260213-00001");
            when(documentRepository.save(any(PtoDocument.class))).thenAnswer(inv -> {
                PtoDocument doc = inv.getArgument(0);
                doc.setId(UUID.randomUUID());
                doc.setCreatedAt(Instant.now());
                return doc;
            });
            when(versionRepository.save(any(PtoDocumentVersion.class))).thenAnswer(inv -> {
                PtoDocumentVersion v = inv.getArgument(0);
                v.setId(UUID.randomUUID());
                return v;
            });

            PtoDocumentResponse response = documentService.createDocument(request);

            assertThat(response.status()).isEqualTo(PtoDocumentStatus.DRAFT);
            assertThat(response.code()).isEqualTo("DOC-20260213-00001");
            assertThat(response.title()).isEqualTo("Исполнительная схема фундамента");
            assertThat(response.documentType()).isEqualTo(PtoDocumentType.EXECUTIVE);
            assertThat(response.discipline()).isEqualTo(Discipline.STRUCTURAL);
            verify(auditService).logCreate(eq("PtoDocument"), any(UUID.class));
        }
    }

    @Nested
    @DisplayName("Get Document")
    class GetDocumentTests {

        @Test
        @DisplayName("Should return document by ID")
        void getDocument_Success() {
            when(documentRepository.findById(documentId)).thenReturn(Optional.of(testDocument));

            PtoDocumentResponse response = documentService.getDocument(documentId);

            assertThat(response.id()).isEqualTo(documentId);
            assertThat(response.title()).isEqualTo("Исполнительная схема фундамента");
        }

        @Test
        @DisplayName("Should throw EntityNotFoundException for missing document")
        void getDocument_NotFound() {
            UUID missingId = UUID.randomUUID();
            when(documentRepository.findById(missingId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> documentService.getDocument(missingId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("ПТО документ не найден");
        }
    }

    @Nested
    @DisplayName("Update Document")
    class UpdateDocumentTests {

        @Test
        @DisplayName("Should update document title and discipline")
        void updateDocument_Success() {
            when(documentRepository.findById(documentId)).thenReturn(Optional.of(testDocument));
            when(documentRepository.save(any(PtoDocument.class))).thenAnswer(inv -> inv.getArgument(0));

            UpdatePtoDocumentRequest request = new UpdatePtoDocumentRequest(
                    "Обновленное название", Discipline.ELECTRICAL, null);

            PtoDocumentResponse response = documentService.updateDocument(documentId, request);

            assertThat(response.title()).isEqualTo("Обновленное название");
            assertThat(response.discipline()).isEqualTo(Discipline.ELECTRICAL);
            verify(auditService).logUpdate(eq("PtoDocument"), eq(documentId), eq("multiple"), any(), any());
        }
    }

    @Nested
    @DisplayName("Change Status")
    class ChangeStatusTests {

        @Test
        @DisplayName("Should transition from DRAFT to IN_REVIEW")
        void changeStatus_DraftToInReview() {
            when(documentRepository.findById(documentId)).thenReturn(Optional.of(testDocument));
            when(documentRepository.save(any(PtoDocument.class))).thenAnswer(inv -> inv.getArgument(0));

            ChangePtoStatusRequest request = new ChangePtoStatusRequest(PtoDocumentStatus.IN_REVIEW);
            PtoDocumentResponse response = documentService.changeStatus(documentId, request);

            assertThat(response.status()).isEqualTo(PtoDocumentStatus.IN_REVIEW);
            verify(auditService).logStatusChange("PtoDocument", documentId, "DRAFT", "IN_REVIEW");
        }

        @Test
        @DisplayName("Should reject invalid status transition DRAFT -> APPROVED")
        void changeStatus_InvalidTransition() {
            when(documentRepository.findById(documentId)).thenReturn(Optional.of(testDocument));

            ChangePtoStatusRequest request = new ChangePtoStatusRequest(PtoDocumentStatus.APPROVED);

            assertThatThrownBy(() -> documentService.changeStatus(documentId, request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно перевести документ");
        }

        @Test
        @DisplayName("Should set approvedAt when transitioning to APPROVED")
        void changeStatus_SetsApprovedAtOnApproval() {
            testDocument.setStatus(PtoDocumentStatus.IN_REVIEW);
            when(documentRepository.findById(documentId)).thenReturn(Optional.of(testDocument));
            when(documentRepository.save(any(PtoDocument.class))).thenAnswer(inv -> inv.getArgument(0));

            ChangePtoStatusRequest request = new ChangePtoStatusRequest(PtoDocumentStatus.APPROVED);
            PtoDocumentResponse response = documentService.changeStatus(documentId, request);

            assertThat(response.status()).isEqualTo(PtoDocumentStatus.APPROVED);
            assertThat(response.approvedAt()).isNotNull();
        }
    }

    @Nested
    @DisplayName("Delete Document")
    class DeleteDocumentTests {

        @Test
        @DisplayName("Should soft-delete document")
        void deleteDocument_Success() {
            when(documentRepository.findById(documentId)).thenReturn(Optional.of(testDocument));
            when(documentRepository.save(any(PtoDocument.class))).thenAnswer(inv -> inv.getArgument(0));

            documentService.deleteDocument(documentId);

            assertThat(testDocument.isDeleted()).isTrue();
            verify(auditService).logDelete("PtoDocument", documentId);
        }
    }
}
