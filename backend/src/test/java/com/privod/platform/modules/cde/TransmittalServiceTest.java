package com.privod.platform.modules.cde;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.cde.domain.DocumentAuditEntry;
import com.privod.platform.modules.cde.domain.DocumentContainer;
import com.privod.platform.modules.cde.domain.DocumentRevision;
import com.privod.platform.modules.cde.domain.Transmittal;
import com.privod.platform.modules.cde.domain.TransmittalItem;
import com.privod.platform.modules.cde.domain.TransmittalPurpose;
import com.privod.platform.modules.cde.domain.TransmittalStatus;
import com.privod.platform.modules.cde.repository.DocumentAuditEntryRepository;
import com.privod.platform.modules.cde.repository.DocumentContainerRepository;
import com.privod.platform.modules.cde.repository.DocumentRevisionRepository;
import com.privod.platform.modules.cde.repository.TransmittalItemRepository;
import com.privod.platform.modules.cde.repository.TransmittalRepository;
import com.privod.platform.modules.cde.service.TransmittalService;
import com.privod.platform.modules.cde.web.dto.AddTransmittalItemRequest;
import com.privod.platform.modules.cde.web.dto.CreateTransmittalRequest;
import com.privod.platform.modules.cde.web.dto.TransmittalResponse;
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
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TransmittalServiceTest {

    @Mock
    private TransmittalRepository transmittalRepository;

    @Mock
    private TransmittalItemRepository transmittalItemRepository;

    @Mock
    private DocumentContainerRepository documentContainerRepository;

    @Mock
    private DocumentRevisionRepository documentRevisionRepository;

    @Mock
    private DocumentAuditEntryRepository documentAuditEntryRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private TransmittalService transmittalService;

    private UUID transmittalId;
    private UUID projectId;
    private Transmittal testTransmittal;

    @BeforeEach
    void setUp() {
        transmittalId = UUID.randomUUID();
        projectId = UUID.randomUUID();
        testTransmittal = Transmittal.builder()
                .projectId(projectId)
                .transmittalNumber("TR-001")
                .subject("Проектная документация для согласования")
                .purpose(TransmittalPurpose.FOR_APPROVAL)
                .status(TransmittalStatus.DRAFT)
                .fromOrganizationId(UUID.randomUUID())
                .toOrganizationId(UUID.randomUUID())
                .dueDate(LocalDate.now().plusDays(14))
                .build();
        testTransmittal.setId(transmittalId);
        testTransmittal.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Создание трансмиттала")
    class CreateTransmittalTests {

        @Test
        @DisplayName("Создание трансмиттала со статусом DRAFT по умолчанию")
        void create_SetsDefaultDraftStatus() {
            CreateTransmittalRequest request = new CreateTransmittalRequest(
                    projectId, "TR-002", "Новый трансмиттал",
                    TransmittalPurpose.FOR_INFORMATION, UUID.randomUUID(),
                    UUID.randomUUID(), LocalDate.now().plusDays(7), "Сопроводительная записка");

            when(transmittalRepository.findByProjectIdAndTransmittalNumberAndDeletedFalse(
                    projectId, "TR-002")).thenReturn(Optional.empty());
            when(transmittalRepository.save(any(Transmittal.class))).thenAnswer(inv -> {
                Transmittal t = inv.getArgument(0);
                t.setId(UUID.randomUUID());
                t.setCreatedAt(Instant.now());
                return t;
            });

            TransmittalResponse response = transmittalService.create(request);

            assertThat(response.status()).isEqualTo(TransmittalStatus.DRAFT);
            assertThat(response.subject()).isEqualTo("Новый трансмиттал");
            verify(auditService).logCreate(eq("Transmittal"), any(UUID.class));
        }

        @Test
        @DisplayName("Отклонение дублирующего номера трансмиттала")
        void create_DuplicateNumber_ThrowsException() {
            CreateTransmittalRequest request = new CreateTransmittalRequest(
                    projectId, "TR-001", "Дубликат",
                    null, null, null, null, null);

            when(transmittalRepository.findByProjectIdAndTransmittalNumberAndDeletedFalse(
                    projectId, "TR-001")).thenReturn(Optional.of(testTransmittal));

            assertThatThrownBy(() -> transmittalService.create(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("уже существует в проекте");
        }
    }

    @Nested
    @DisplayName("Выпуск трансмиттала")
    class IssueTransmittalTests {

        @Test
        @DisplayName("Выпуск трансмиттала создаёт записи аудита для каждого документа")
        void issue_CreatesAuditEntriesForEachItem() {
            UUID containerId1 = UUID.randomUUID();
            UUID containerId2 = UUID.randomUUID();
            UUID sentById = UUID.randomUUID();

            TransmittalItem item1 = TransmittalItem.builder()
                    .transmittalId(transmittalId)
                    .documentContainerId(containerId1)
                    .revisionId(UUID.randomUUID())
                    .sortOrder(1)
                    .build();
            item1.setId(UUID.randomUUID());

            TransmittalItem item2 = TransmittalItem.builder()
                    .transmittalId(transmittalId)
                    .documentContainerId(containerId2)
                    .revisionId(UUID.randomUUID())
                    .sortOrder(2)
                    .build();
            item2.setId(UUID.randomUUID());

            when(transmittalRepository.findById(transmittalId)).thenReturn(Optional.of(testTransmittal));
            when(transmittalItemRepository.findByTransmittalIdAndDeletedFalseOrderBySortOrderAsc(transmittalId))
                    .thenReturn(List.of(item1, item2));
            when(transmittalRepository.save(any(Transmittal.class))).thenAnswer(inv -> inv.getArgument(0));
            when(documentAuditEntryRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            TransmittalResponse response = transmittalService.issue(transmittalId, sentById);

            assertThat(response.status()).isEqualTo(TransmittalStatus.ISSUED);
            assertThat(response.issuedDate()).isEqualTo(LocalDate.now());
            assertThat(response.sentById()).isEqualTo(sentById);

            // Verify audit entries created for each item
            ArgumentCaptor<DocumentAuditEntry> captor = ArgumentCaptor.forClass(DocumentAuditEntry.class);
            verify(documentAuditEntryRepository, times(2)).save(captor.capture());

            List<DocumentAuditEntry> entries = captor.getAllValues();
            assertThat(entries).hasSize(2);
            assertThat(entries.get(0).getAction()).isEqualTo("TRANSMITTED");
            assertThat(entries.get(0).getDocumentContainerId()).isEqualTo(containerId1);
            assertThat(entries.get(1).getDocumentContainerId()).isEqualTo(containerId2);
        }

        @Test
        @DisplayName("Выпуск пустого трансмиттала отклоняется")
        void issue_EmptyTransmittal_ThrowsException() {
            when(transmittalRepository.findById(transmittalId)).thenReturn(Optional.of(testTransmittal));
            when(transmittalItemRepository.findByTransmittalIdAndDeletedFalseOrderBySortOrderAsc(transmittalId))
                    .thenReturn(List.of());

            assertThatThrownBy(() -> transmittalService.issue(transmittalId, UUID.randomUUID()))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("без позиций");
        }

        @Test
        @DisplayName("Повторный выпуск уже выпущенного трансмиттала отклоняется")
        void issue_AlreadyIssued_ThrowsException() {
            testTransmittal.setStatus(TransmittalStatus.ISSUED);
            when(transmittalRepository.findById(transmittalId)).thenReturn(Optional.of(testTransmittal));

            assertThatThrownBy(() -> transmittalService.issue(transmittalId, UUID.randomUUID()))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("статусе 'Черновик'");
        }
    }

    @Nested
    @DisplayName("Рабочий процесс трансмиттала")
    class TransmittalWorkflowTests {

        @Test
        @DisplayName("Подтверждение выпущенного трансмиттала")
        void acknowledge_IssuedTransmittal_Success() {
            testTransmittal.setStatus(TransmittalStatus.ISSUED);
            when(transmittalRepository.findById(transmittalId)).thenReturn(Optional.of(testTransmittal));
            when(transmittalRepository.save(any(Transmittal.class))).thenAnswer(inv -> inv.getArgument(0));

            TransmittalResponse response = transmittalService.acknowledge(transmittalId);

            assertThat(response.status()).isEqualTo(TransmittalStatus.ACKNOWLEDGED);
            assertThat(response.acknowledgedDate()).isEqualTo(LocalDate.now());
        }

        @Test
        @DisplayName("Подтверждение трансмиттала в статусе DRAFT отклоняется")
        void acknowledge_DraftTransmittal_ThrowsException() {
            when(transmittalRepository.findById(transmittalId)).thenReturn(Optional.of(testTransmittal));

            assertThatThrownBy(() -> transmittalService.acknowledge(transmittalId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("статусе 'Выпущен'");
        }

        @Test
        @DisplayName("Закрытие подтверждённого трансмиттала")
        void close_AcknowledgedTransmittal_Success() {
            testTransmittal.setStatus(TransmittalStatus.ACKNOWLEDGED);
            when(transmittalRepository.findById(transmittalId)).thenReturn(Optional.of(testTransmittal));
            when(transmittalRepository.save(any(Transmittal.class))).thenAnswer(inv -> inv.getArgument(0));

            TransmittalResponse response = transmittalService.close(transmittalId);

            assertThat(response.status()).isEqualTo(TransmittalStatus.CLOSED);
        }
    }

    @Nested
    @DisplayName("Добавление позиций")
    class AddItemTests {

        @Test
        @DisplayName("Добавление позиции к трансмитталу в статусе DRAFT")
        void addItem_DraftTransmittal_Success() {
            UUID docId = UUID.randomUUID();
            UUID revId = UUID.randomUUID();

            DocumentContainer container = DocumentContainer.builder().build();
            container.setId(docId);

            DocumentRevision revision = DocumentRevision.builder().build();
            revision.setId(revId);

            when(transmittalRepository.findById(transmittalId)).thenReturn(Optional.of(testTransmittal));
            when(documentContainerRepository.findById(docId)).thenReturn(Optional.of(container));
            when(documentRevisionRepository.findById(revId)).thenReturn(Optional.of(revision));
            when(transmittalItemRepository.save(any(TransmittalItem.class))).thenAnswer(inv -> {
                TransmittalItem item = inv.getArgument(0);
                item.setId(UUID.randomUUID());
                item.setCreatedAt(Instant.now());
                return item;
            });

            AddTransmittalItemRequest request = new AddTransmittalItemRequest(docId, revId, "Заметка", true, 1);
            var response = transmittalService.addItem(transmittalId, request);

            assertThat(response).isNotNull();
            assertThat(response.documentContainerId()).isEqualTo(docId);
            assertThat(response.revisionId()).isEqualTo(revId);
            assertThat(response.responseRequired()).isTrue();
        }

        @Test
        @DisplayName("Добавление позиции к выпущенному трансмитталу отклоняется")
        void addItem_IssuedTransmittal_ThrowsException() {
            testTransmittal.setStatus(TransmittalStatus.ISSUED);
            when(transmittalRepository.findById(transmittalId)).thenReturn(Optional.of(testTransmittal));

            AddTransmittalItemRequest request = new AddTransmittalItemRequest(
                    UUID.randomUUID(), UUID.randomUUID(), null, null, null);

            assertThatThrownBy(() -> transmittalService.addItem(transmittalId, request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("статусе 'Черновик'");
        }
    }
}
