package com.privod.platform.modules.cde;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.cde.domain.DocumentClassification;
import com.privod.platform.modules.cde.domain.DocumentContainer;
import com.privod.platform.modules.cde.domain.DocumentLifecycleState;
import com.privod.platform.modules.cde.domain.DocumentRevision;
import com.privod.platform.modules.cde.domain.RevisionStatus;
import com.privod.platform.modules.cde.repository.DocumentAuditEntryRepository;
import com.privod.platform.modules.cde.repository.DocumentContainerRepository;
import com.privod.platform.modules.cde.repository.DocumentRevisionRepository;
import com.privod.platform.modules.cde.service.DocumentContainerService;
import com.privod.platform.modules.cde.web.dto.ChangeLifecycleStateRequest;
import com.privod.platform.modules.cde.web.dto.CreateDocumentContainerRequest;
import com.privod.platform.modules.cde.web.dto.CreateRevisionRequest;
import com.privod.platform.modules.cde.web.dto.DocumentContainerResponse;
import com.privod.platform.modules.cde.web.dto.DocumentRevisionResponse;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
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
class DocumentContainerServiceTest {

    @Mock
    private DocumentContainerRepository documentContainerRepository;

    @Mock
    private DocumentRevisionRepository documentRevisionRepository;

    @Mock
    private DocumentAuditEntryRepository documentAuditEntryRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private DocumentContainerService documentContainerService;

    private UUID containerId;
    private DocumentContainer testContainer;

    @BeforeEach
    void setUp() {
        containerId = UUID.randomUUID();
        testContainer = DocumentContainer.builder()
                .projectId(UUID.randomUUID())
                .documentNumber("DOC-001")
                .title("Проектная документация фасада")
                .description("Описание документа")
                .classification(DocumentClassification.DESIGN)
                .lifecycleState(DocumentLifecycleState.WIP)
                .discipline("Architecture")
                .originatorCode("ORG-01")
                .build();
        testContainer.setId(containerId);
        testContainer.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Создание документа")
    class CreateDocumentTests {

        @Test
        @DisplayName("Создание документа с состоянием WIP по умолчанию")
        void create_SetsDefaultWipState() {
            CreateDocumentContainerRequest request = new CreateDocumentContainerRequest(
                    UUID.randomUUID(), "DOC-002", "Новый документ", "Описание",
                    DocumentClassification.CONSTRUCTION, "Structural", null, null,
                    "ORG-02", "DWG", null, null);

            when(documentContainerRepository.findByProjectIdAndDocumentNumberAndDeletedFalse(
                    any(UUID.class), eq("DOC-002"))).thenReturn(Optional.empty());
            when(documentContainerRepository.save(any(DocumentContainer.class))).thenAnswer(inv -> {
                DocumentContainer c = inv.getArgument(0);
                c.setId(UUID.randomUUID());
                c.setCreatedAt(Instant.now());
                return c;
            });
            when(documentAuditEntryRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            DocumentContainerResponse response = documentContainerService.create(request);

            assertThat(response.lifecycleState()).isEqualTo(DocumentLifecycleState.WIP);
            assertThat(response.title()).isEqualTo("Новый документ");
            verify(auditService).logCreate(eq("DocumentContainer"), any(UUID.class));
        }

        @Test
        @DisplayName("Отклонение дублирующего номера документа в проекте")
        void create_DuplicateNumber_ThrowsException() {
            UUID projectId = UUID.randomUUID();
            CreateDocumentContainerRequest request = new CreateDocumentContainerRequest(
                    projectId, "DOC-001", "Дубликат", null,
                    null, null, null, null, null, null, null, null);

            when(documentContainerRepository.findByProjectIdAndDocumentNumberAndDeletedFalse(
                    projectId, "DOC-001")).thenReturn(Optional.of(testContainer));

            assertThatThrownBy(() -> documentContainerService.create(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("уже существует в проекте");
        }
    }

    @Nested
    @DisplayName("Изменение состояния жизненного цикла")
    class LifecycleStateTests {

        @Test
        @DisplayName("Допустимый переход WIP -> SHARED")
        void changeState_WipToShared_Success() {
            when(documentContainerRepository.findById(containerId)).thenReturn(Optional.of(testContainer));
            when(documentContainerRepository.save(any(DocumentContainer.class))).thenAnswer(inv -> inv.getArgument(0));
            when(documentAuditEntryRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            ChangeLifecycleStateRequest request = new ChangeLifecycleStateRequest(DocumentLifecycleState.SHARED);
            DocumentContainerResponse response = documentContainerService.changeLifecycleState(containerId, request);

            assertThat(response.lifecycleState()).isEqualTo(DocumentLifecycleState.SHARED);
            verify(auditService).logStatusChange("DocumentContainer", containerId, "WIP", "SHARED");
        }

        @Test
        @DisplayName("Недопустимый переход WIP -> PUBLISHED отклоняется")
        void changeState_WipToPublished_ThrowsException() {
            when(documentContainerRepository.findById(containerId)).thenReturn(Optional.of(testContainer));

            ChangeLifecycleStateRequest request = new ChangeLifecycleStateRequest(DocumentLifecycleState.PUBLISHED);

            assertThatThrownBy(() -> documentContainerService.changeLifecycleState(containerId, request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно перевести документ");
        }

        @Test
        @DisplayName("Обратный переход SHARED -> WIP отклоняется")
        void changeState_SharedToWip_ThrowsException() {
            testContainer.setLifecycleState(DocumentLifecycleState.SHARED);
            when(documentContainerRepository.findById(containerId)).thenReturn(Optional.of(testContainer));

            ChangeLifecycleStateRequest request = new ChangeLifecycleStateRequest(DocumentLifecycleState.WIP);

            assertThatThrownBy(() -> documentContainerService.changeLifecycleState(containerId, request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("ISO 19650");
        }
    }

    @Nested
    @DisplayName("Управление ревизиями")
    class RevisionTests {

        @Test
        @DisplayName("Добавление ревизии: предыдущая текущая становится заменённой")
        void addRevision_SupersedesOldCurrent() {
            UUID oldRevisionId = UUID.randomUUID();
            DocumentRevision oldRevision = DocumentRevision.builder()
                    .documentContainerId(containerId)
                    .revisionNumber("P01")
                    .revisionStatus(RevisionStatus.CURRENT)
                    .build();
            oldRevision.setId(oldRevisionId);

            testContainer.setCurrentRevisionId(oldRevisionId);

            when(documentContainerRepository.findById(containerId)).thenReturn(Optional.of(testContainer));
            when(documentRevisionRepository.findByDocumentContainerIdAndRevisionStatusAndDeletedFalse(
                    containerId, RevisionStatus.CURRENT)).thenReturn(List.of(oldRevision));
            when(documentRevisionRepository.save(any(DocumentRevision.class))).thenAnswer(inv -> {
                DocumentRevision r = inv.getArgument(0);
                if (r.getId() == null) {
                    r.setId(UUID.randomUUID());
                    r.setCreatedAt(Instant.now());
                }
                return r;
            });
            when(documentContainerRepository.save(any(DocumentContainer.class))).thenAnswer(inv -> inv.getArgument(0));
            when(documentAuditEntryRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            CreateRevisionRequest request = new CreateRevisionRequest(
                    "P02", "Вторая ревизия", null, "doc.pdf", 1024L, "application/pdf");

            DocumentRevisionResponse response = documentContainerService.addRevision(containerId, request);

            assertThat(response.revisionNumber()).isEqualTo("P02");
            assertThat(response.revisionStatus()).isEqualTo(RevisionStatus.CURRENT);

            // Verify old revision was superseded
            assertThat(oldRevision.getRevisionStatus()).isEqualTo(RevisionStatus.SUPERSEDED);
            assertThat(oldRevision.getSupersededById()).isNotNull();
            assertThat(oldRevision.getSupersededAt()).isNotNull();
        }

        @Test
        @DisplayName("Добавление первой ревизии к документу без текущей")
        void addRevision_FirstRevision_SetsAsCurrent() {
            when(documentContainerRepository.findById(containerId)).thenReturn(Optional.of(testContainer));
            when(documentRevisionRepository.findByDocumentContainerIdAndRevisionStatusAndDeletedFalse(
                    containerId, RevisionStatus.CURRENT)).thenReturn(List.of());
            when(documentRevisionRepository.save(any(DocumentRevision.class))).thenAnswer(inv -> {
                DocumentRevision r = inv.getArgument(0);
                r.setId(UUID.randomUUID());
                r.setCreatedAt(Instant.now());
                return r;
            });
            when(documentContainerRepository.save(any(DocumentContainer.class))).thenAnswer(inv -> inv.getArgument(0));
            when(documentAuditEntryRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            CreateRevisionRequest request = new CreateRevisionRequest(
                    "A", "Первая ревизия", null, null, null, null);

            DocumentRevisionResponse response = documentContainerService.addRevision(containerId, request);

            assertThat(response.revisionStatus()).isEqualTo(RevisionStatus.CURRENT);

            // Verify container's currentRevisionId was updated
            ArgumentCaptor<DocumentContainer> captor = ArgumentCaptor.forClass(DocumentContainer.class);
            verify(documentContainerRepository).save(captor.capture());
            assertThat(captor.getValue().getCurrentRevisionId()).isEqualTo(response.id());
        }
    }

    @Test
    @DisplayName("Получение документа по ID")
    void findById_Success() {
        when(documentContainerRepository.findById(containerId)).thenReturn(Optional.of(testContainer));

        DocumentContainerResponse response = documentContainerService.findById(containerId);

        assertThat(response).isNotNull();
        assertThat(response.documentNumber()).isEqualTo("DOC-001");
        assertThat(response.title()).isEqualTo("Проектная документация фасада");
    }

    @Test
    @DisplayName("Ошибка при поиске несуществующего документа")
    void findById_NotFound() {
        UUID nonExistentId = UUID.randomUUID();
        when(documentContainerRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> documentContainerService.findById(nonExistentId))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Контейнер документа не найден");
    }

    @Test
    @DisplayName("Мягкое удаление документа")
    void delete_SoftDeletes() {
        when(documentContainerRepository.findById(containerId)).thenReturn(Optional.of(testContainer));
        when(documentContainerRepository.save(any(DocumentContainer.class))).thenReturn(testContainer);
        when(documentAuditEntryRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        documentContainerService.delete(containerId);

        assertThat(testContainer.isDeleted()).isTrue();
        verify(documentContainerRepository).save(testContainer);
        verify(auditService).logDelete("DocumentContainer", containerId);
    }
}
