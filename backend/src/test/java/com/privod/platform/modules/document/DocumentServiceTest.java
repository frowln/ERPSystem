package com.privod.platform.modules.document;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.document.domain.AccessLevel;
import com.privod.platform.modules.document.domain.Document;
import com.privod.platform.modules.document.domain.DocumentCategory;
import com.privod.platform.modules.document.domain.DocumentStatus;
import com.privod.platform.modules.document.repository.DocumentAccessRepository;
import com.privod.platform.modules.document.repository.DocumentCommentRepository;
import com.privod.platform.modules.document.repository.DocumentRepository;
import com.privod.platform.modules.document.service.DocumentService;
import com.privod.platform.modules.document.web.dto.ChangeDocumentStatusRequest;
import com.privod.platform.modules.document.web.dto.CreateDocumentRequest;
import com.privod.platform.modules.document.web.dto.DocumentAccessResponse;
import com.privod.platform.modules.document.web.dto.DocumentResponse;
import com.privod.platform.modules.document.web.dto.GrantAccessRequest;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.time.LocalDate;
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
class DocumentServiceTest {

    @Mock
    private DocumentRepository documentRepository;

    @Mock
    private DocumentAccessRepository accessRepository;

    @Mock
    private DocumentCommentRepository commentRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private DocumentService documentService;

    private UUID documentId;
    private UUID projectId;
    private Document testDocument;

    @BeforeEach
    void setUp() {
        documentId = UUID.randomUUID();
        projectId = UUID.randomUUID();

        testDocument = Document.builder()
                .title("Акт выполненных работ КС-2")
                .documentNumber("КС-2-001")
                .category(DocumentCategory.ACT)
                .status(DocumentStatus.DRAFT)
                .projectId(projectId)
                .description("Акт выполненных работ за январь 2025")
                .fileName("ks2_001.pdf")
                .fileSize(1024000L)
                .mimeType("application/pdf")
                .storagePath("/documents/projects/" + projectId + "/ks2_001.pdf")
                .authorId(UUID.randomUUID())
                .authorName("Иванов И.И.")
                .tags("акт,кс-2,январь")
                .build();
        testDocument.setId(documentId);
        testDocument.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Document")
    class CreateDocumentTests {

        @Test
        @DisplayName("Should create document with DRAFT status")
        void createDocument_SetsDefaultDraftStatus() {
            CreateDocumentRequest request = new CreateDocumentRequest(
                    "Новый акт", "КС-2-002", DocumentCategory.ACT,
                    projectId, null, "Описание акта",
                    "ks2_002.pdf", 2048000L, "application/pdf",
                    "/documents/ks2_002.pdf",
                    UUID.randomUUID(), "Петров П.П.",
                    "акт,кс-2", null, null);

            when(documentRepository.save(any(Document.class))).thenAnswer(invocation -> {
                Document d = invocation.getArgument(0);
                d.setId(UUID.randomUUID());
                d.setCreatedAt(Instant.now());
                return d;
            });

            DocumentResponse response = documentService.createDocument(request);

            assertThat(response.status()).isEqualTo(DocumentStatus.DRAFT);
            assertThat(response.title()).isEqualTo("Новый акт");
            assertThat(response.category()).isEqualTo(DocumentCategory.ACT);
            verify(auditService).logCreate(eq("Document"), any(UUID.class));
        }
    }

    @Nested
    @DisplayName("Create Version")
    class CreateVersionTests {

        @Test
        @DisplayName("Should create a new version of the document")
        void createVersion_IncrementVersion() {
            when(documentRepository.findById(documentId)).thenReturn(Optional.of(testDocument));
            when(documentRepository.save(any(Document.class))).thenAnswer(invocation -> {
                Document d = invocation.getArgument(0);
                d.setId(UUID.randomUUID());
                d.setCreatedAt(Instant.now());
                return d;
            });

            DocumentResponse response = documentService.createVersion(documentId);

            assertThat(response.docVersion()).isEqualTo(2);
            assertThat(response.parentVersionId()).isEqualTo(documentId);
            assertThat(response.status()).isEqualTo(DocumentStatus.DRAFT);
            assertThat(response.title()).isEqualTo(testDocument.getTitle());
            verify(auditService).logCreate(eq("Document"), any(UUID.class));
        }
    }

    @Nested
    @DisplayName("Change Status")
    class ChangeStatusTests {

        @Test
        @DisplayName("Should allow valid status transition DRAFT -> UNDER_REVIEW")
        void changeStatus_ValidTransition() {
            when(documentRepository.findById(documentId)).thenReturn(Optional.of(testDocument));
            when(documentRepository.save(any(Document.class))).thenAnswer(inv -> inv.getArgument(0));

            ChangeDocumentStatusRequest request = new ChangeDocumentStatusRequest(DocumentStatus.UNDER_REVIEW);
            DocumentResponse response = documentService.changeStatus(documentId, request);

            assertThat(response.status()).isEqualTo(DocumentStatus.UNDER_REVIEW);
            verify(auditService).logStatusChange("Document", documentId, "DRAFT", "UNDER_REVIEW");
        }

        @Test
        @DisplayName("Should reject invalid status transition DRAFT -> ACTIVE")
        void changeStatus_InvalidTransition() {
            when(documentRepository.findById(documentId)).thenReturn(Optional.of(testDocument));

            ChangeDocumentStatusRequest request = new ChangeDocumentStatusRequest(DocumentStatus.ACTIVE);

            assertThatThrownBy(() -> documentService.changeStatus(documentId, request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно перевести документ");
        }
    }

    @Nested
    @DisplayName("Grant Access")
    class GrantAccessTests {

        @Test
        @DisplayName("Should grant access to a document for a user")
        void grantAccess_NewAccess() {
            UUID userId = UUID.randomUUID();
            UUID grantedById = UUID.randomUUID();

            when(documentRepository.findById(documentId)).thenReturn(Optional.of(testDocument));
            when(accessRepository.findByDocumentIdAndUserIdAndDeletedFalse(documentId, userId))
                    .thenReturn(Optional.empty());
            when(accessRepository.save(any())).thenAnswer(invocation -> {
                var access = invocation.getArgument(0);
                if (access instanceof com.privod.platform.modules.document.domain.DocumentAccess da) {
                    da.setId(UUID.randomUUID());
                    da.setCreatedAt(Instant.now());
                }
                return access;
            });

            GrantAccessRequest request = new GrantAccessRequest(
                    userId, AccessLevel.EDIT, grantedById, "Админ А.А.");
            DocumentAccessResponse response = documentService.grantAccess(documentId, request);

            assertThat(response.userId()).isEqualTo(userId);
            assertThat(response.accessLevel()).isEqualTo(AccessLevel.EDIT);
            assertThat(response.grantedByName()).isEqualTo("Админ А.А.");
        }
    }

    @Nested
    @DisplayName("Search Documents")
    class SearchDocumentsTests {

        @Test
        @DisplayName("Should search documents by query text")
        void searchDocuments_ReturnsMatching() {
            Pageable pageable = PageRequest.of(0, 20);
            Page<Document> page = new PageImpl<>(List.of(testDocument), pageable, 1);

            when(documentRepository.searchDocuments("акт", projectId, pageable)).thenReturn(page);

            Page<DocumentResponse> result = documentService.searchDocuments("акт", projectId, pageable);

            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).title()).isEqualTo("Акт выполненных работ КС-2");
        }
    }

    @Nested
    @DisplayName("Expiring Documents")
    class ExpiringDocumentsTests {

        @Test
        @DisplayName("Should return documents expiring within specified days")
        void getExpiringDocuments_ReturnsExpiring() {
            Document expiringDoc = Document.builder()
                    .title("Разрешение на строительство")
                    .category(DocumentCategory.PERMIT)
                    .status(DocumentStatus.ACTIVE)
                    .projectId(projectId)
                    .expiryDate(LocalDate.now().plusDays(15))
                    .authorId(UUID.randomUUID())
                    .authorName("Иванов И.И.")
                    .build();
            expiringDoc.setId(UUID.randomUUID());
            expiringDoc.setCreatedAt(Instant.now());

            LocalDate deadline = LocalDate.now().plusDays(30);
            when(documentRepository.findExpiringDocuments(deadline)).thenReturn(List.of(expiringDoc));

            List<DocumentResponse> result = documentService.getExpiringDocuments(30);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).title()).isEqualTo("Разрешение на строительство");
            assertThat(result.get(0).category()).isEqualTo(DocumentCategory.PERMIT);
            assertThat(result.get(0).expiryDate()).isBefore(deadline.plusDays(1));
        }
    }
}
