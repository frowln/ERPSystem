package com.privod.platform.modules.document.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.document.domain.Document;
import com.privod.platform.modules.document.domain.DocumentAccess;
import com.privod.platform.modules.document.domain.DocumentCategory;
import com.privod.platform.modules.document.domain.DocumentComment;
import com.privod.platform.modules.document.domain.DocumentStatus;
import com.privod.platform.modules.document.repository.DocumentAccessRepository;
import com.privod.platform.modules.document.repository.DocumentCommentRepository;
import com.privod.platform.modules.document.repository.DocumentRepository;
import com.privod.platform.modules.document.web.dto.AddDocumentCommentRequest;
import com.privod.platform.modules.document.web.dto.ChangeDocumentStatusRequest;
import com.privod.platform.modules.document.web.dto.CreateDocumentRequest;
import com.privod.platform.modules.document.web.dto.DocumentAccessResponse;
import com.privod.platform.modules.document.web.dto.DocumentCommentResponse;
import com.privod.platform.modules.document.web.dto.DocumentResponse;
import com.privod.platform.modules.document.web.dto.GrantAccessRequest;
import com.privod.platform.modules.document.web.dto.UpdateDocumentRequest;
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
import java.time.LocalDate;
import java.util.Collections;
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
                .title("Проектная документация")
                .documentNumber("DOC-001")
                .category(DocumentCategory.PROJECT)
                .status(DocumentStatus.DRAFT)
                .projectId(projectId)
                .fileName("project_doc.pdf")
                .fileSize(2048L)
                .mimeType("application/pdf")
                .storagePath("/documents/project_doc.pdf")
                .authorId(UUID.randomUUID())
                .authorName("Иванов И.И.")
                .docVersion(1)
                .build();
        testDocument.setId(documentId);
        testDocument.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Document")
    class CreateDocumentTests {

        @Test
        @DisplayName("Should create document with DRAFT status")
        void shouldCreateDocument_whenValidInput() {
            CreateDocumentRequest request = new CreateDocumentRequest(
                    "Новый документ", "DOC-002", DocumentCategory.CONTRACT,
                    projectId, null, "Описание", "file.pdf", 1024L,
                    "application/pdf", "/docs/file.pdf", UUID.randomUUID(),
                    "Петров П.П.", List.of("важный"), null, null);

            when(documentRepository.save(any(Document.class))).thenAnswer(inv -> {
                Document doc = inv.getArgument(0);
                doc.setId(UUID.randomUUID());
                doc.setCreatedAt(Instant.now());
                return doc;
            });

            DocumentResponse response = documentService.createDocument(request);

            assertThat(response.status()).isEqualTo(DocumentStatus.DRAFT);
            assertThat(response.title()).isEqualTo("Новый документ");
            verify(auditService).logCreate(eq("Document"), any(UUID.class));
        }
    }

    @Nested
    @DisplayName("Get Document")
    class GetDocumentTests {

        @Test
        @DisplayName("Should find document by ID with access list")
        void shouldReturnDocument_whenExists() {
            when(documentRepository.findById(documentId)).thenReturn(Optional.of(testDocument));
            when(accessRepository.findByDocumentIdAndDeletedFalse(documentId))
                    .thenReturn(Collections.emptyList());

            DocumentResponse response = documentService.getDocument(documentId);

            assertThat(response).isNotNull();
            assertThat(response.title()).isEqualTo("Проектная документация");
        }

        @Test
        @DisplayName("Should throw when document not found")
        void shouldThrowException_whenDocumentNotFound() {
            UUID nonExistent = UUID.randomUUID();
            when(documentRepository.findById(nonExistent)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> documentService.getDocument(nonExistent))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Документ не найден");
        }
    }

    @Nested
    @DisplayName("Update Document")
    class UpdateDocumentTests {

        @Test
        @DisplayName("Should update document fields")
        void shouldUpdateDocument_whenValidInput() {
            when(documentRepository.findById(documentId)).thenReturn(Optional.of(testDocument));
            when(documentRepository.save(any(Document.class))).thenAnswer(inv -> inv.getArgument(0));

            UpdateDocumentRequest request = new UpdateDocumentRequest(
                    "Обновлённый документ", null, null, null, null,
                    "Новое описание", null, null, null, null,
                    null, null, null);

            DocumentResponse response = documentService.updateDocument(documentId, request);

            assertThat(testDocument.getTitle()).isEqualTo("Обновлённый документ");
            assertThat(testDocument.getDescription()).isEqualTo("Новое описание");
            verify(auditService).logUpdate("Document", documentId, "multiple", null, null);
        }
    }

    @Nested
    @DisplayName("Status Transitions")
    class StatusTransitionTests {

        @Test
        @DisplayName("Should reject invalid document status transition")
        void shouldThrowException_whenInvalidTransition() {
            when(documentRepository.findById(documentId)).thenReturn(Optional.of(testDocument));

            ChangeDocumentStatusRequest request = new ChangeDocumentStatusRequest(DocumentStatus.ARCHIVED);

            assertThatThrownBy(() -> documentService.changeStatus(documentId, request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно перевести документ");
        }
    }

    @Nested
    @DisplayName("Document Versioning")
    class VersioningTests {

        @Test
        @DisplayName("Should create new version with incremented docVersion")
        void shouldCreateNewVersion_whenVersionRequested() {
            when(documentRepository.findById(documentId)).thenReturn(Optional.of(testDocument));
            when(documentRepository.save(any(Document.class))).thenAnswer(inv -> {
                Document doc = inv.getArgument(0);
                doc.setId(UUID.randomUUID());
                doc.setCreatedAt(Instant.now());
                return doc;
            });

            DocumentResponse response = documentService.createVersion(documentId);

            assertThat(response.status()).isEqualTo(DocumentStatus.DRAFT);
            assertThat(response.docVersion()).isEqualTo(2);
            assertThat(response.parentVersionId()).isEqualTo(documentId);
            verify(auditService).logCreate(eq("Document"), any(UUID.class));
        }
    }

    @Nested
    @DisplayName("Comments")
    class CommentTests {

        @Test
        @DisplayName("Should add comment to document")
        void shouldAddComment_whenDocumentExists() {
            AddDocumentCommentRequest request = new AddDocumentCommentRequest(
                    "Иванов И.И.", "Требуется доработка");

            when(documentRepository.findById(documentId)).thenReturn(Optional.of(testDocument));
            when(commentRepository.save(any(DocumentComment.class))).thenAnswer(inv -> {
                DocumentComment c = inv.getArgument(0);
                c.setId(UUID.randomUUID());
                c.setCreatedAt(Instant.now());
                return c;
            });

            DocumentCommentResponse response = documentService.addComment(documentId, request);

            assertThat(response).isNotNull();
            assertThat(response.content()).isEqualTo("Требуется доработка");
        }
    }

    @Nested
    @DisplayName("Access Management")
    class AccessTests {

        @Test
        @DisplayName("Should grant access to user")
        void shouldGrantAccess_whenNewUser() {
            UUID userId = UUID.randomUUID();
            GrantAccessRequest request = new GrantAccessRequest(
                    userId, "READ", UUID.randomUUID(), "Админ");

            when(documentRepository.findById(documentId)).thenReturn(Optional.of(testDocument));
            when(accessRepository.findByDocumentIdAndUserIdAndDeletedFalse(documentId, userId))
                    .thenReturn(Optional.empty());
            when(accessRepository.save(any(DocumentAccess.class))).thenAnswer(inv -> {
                DocumentAccess a = inv.getArgument(0);
                a.setId(UUID.randomUUID());
                a.setCreatedAt(Instant.now());
                return a;
            });

            DocumentAccessResponse response = documentService.grantAccess(documentId, request);

            assertThat(response).isNotNull();
            assertThat(response.accessLevel()).isEqualTo("READ");
        }

        @Test
        @DisplayName("Should revoke access from user")
        void shouldRevokeAccess_whenAccessExists() {
            UUID userId = UUID.randomUUID();
            DocumentAccess access = DocumentAccess.builder()
                    .documentId(documentId)
                    .userId(userId)
                    .accessLevel("READ")
                    .build();
            access.setId(UUID.randomUUID());
            access.setCreatedAt(Instant.now());

            when(accessRepository.findByDocumentIdAndUserIdAndDeletedFalse(documentId, userId))
                    .thenReturn(Optional.of(access));
            when(accessRepository.save(any(DocumentAccess.class))).thenAnswer(inv -> inv.getArgument(0));

            documentService.revokeAccess(documentId, userId);

            assertThat(access.isDeleted()).isTrue();
        }

        @Test
        @DisplayName("Should throw when revoking non-existent access")
        void shouldThrowException_whenRevokeNonExistentAccess() {
            UUID userId = UUID.randomUUID();
            when(accessRepository.findByDocumentIdAndUserIdAndDeletedFalse(documentId, userId))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> documentService.revokeAccess(documentId, userId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Доступ не найден");
        }
    }
}
