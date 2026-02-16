package com.privod.platform.modules.m29.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.m29.domain.M29Document;
import com.privod.platform.modules.m29.domain.M29Line;
import com.privod.platform.modules.m29.domain.M29Status;
import com.privod.platform.modules.m29.repository.M29DocumentRepository;
import com.privod.platform.modules.m29.repository.M29LineRepository;
import com.privod.platform.modules.m29.web.dto.CreateM29LineRequest;
import com.privod.platform.modules.m29.web.dto.CreateM29Request;
import com.privod.platform.modules.m29.web.dto.M29LineResponse;
import com.privod.platform.modules.m29.web.dto.M29Response;
import com.privod.platform.modules.m29.web.dto.UpdateM29Request;
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
class M29ServiceTest {

    @Mock
    private M29DocumentRepository m29DocumentRepository;

    @Mock
    private M29LineRepository m29LineRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private M29Service m29Service;

    private UUID m29Id;
    private UUID projectId;
    private UUID contractId;
    private M29Document testM29;

    @BeforeEach
    void setUp() {
        m29Id = UUID.randomUUID();
        projectId = UUID.randomUUID();
        contractId = UUID.randomUUID();

        testM29 = M29Document.builder()
                .name("М-29-00001")
                .documentDate(LocalDate.of(2025, 6, 15))
                .projectId(projectId)
                .contractId(contractId)
                .status(M29Status.DRAFT)
                .notes("Тестовый М-29")
                .build();
        testM29.setId(m29Id);
        testM29.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create M-29")
    class CreateM29Tests {

        @Test
        @DisplayName("Should create M-29 document with DRAFT status")
        void shouldCreateM29_whenValidInput() {
            CreateM29Request request = new CreateM29Request(
                    LocalDate.of(2025, 7, 1), projectId, contractId,
                    null, null, null);

            when(m29DocumentRepository.getNextNameSequence()).thenReturn(1L);
            when(m29DocumentRepository.save(any(M29Document.class))).thenAnswer(inv -> {
                M29Document doc = inv.getArgument(0);
                doc.setId(UUID.randomUUID());
                doc.setCreatedAt(Instant.now());
                return doc;
            });

            M29Response response = m29Service.createM29(request);

            assertThat(response.status()).isEqualTo(M29Status.DRAFT);
            assertThat(response.name()).isEqualTo("М-29-00001");
            verify(auditService).logCreate(eq("M29Document"), any(UUID.class));
        }
    }

    @Nested
    @DisplayName("Get M-29")
    class GetM29Tests {

        @Test
        @DisplayName("Should find M-29 by ID")
        void shouldReturnM29_whenExists() {
            when(m29DocumentRepository.findById(m29Id)).thenReturn(Optional.of(testM29));
            when(m29LineRepository.findByM29IdAndDeletedFalseOrderBySequenceAsc(m29Id))
                    .thenReturn(Collections.emptyList());

            M29Response response = m29Service.getM29(m29Id);

            assertThat(response).isNotNull();
            assertThat(response.name()).isEqualTo("М-29-00001");
        }

        @Test
        @DisplayName("Should throw when M-29 not found")
        void shouldThrowException_whenM29NotFound() {
            UUID nonExistent = UUID.randomUUID();
            when(m29DocumentRepository.findById(nonExistent)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> m29Service.getM29(nonExistent))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Документ М-29 не найден");
        }
    }

    @Nested
    @DisplayName("Update M-29")
    class UpdateM29Tests {

        @Test
        @DisplayName("Should update M-29 when DRAFT")
        void shouldUpdateM29_whenDraft() {
            when(m29DocumentRepository.findById(m29Id)).thenReturn(Optional.of(testM29));
            when(m29DocumentRepository.save(any(M29Document.class))).thenAnswer(inv -> inv.getArgument(0));
            when(m29LineRepository.findByM29IdAndDeletedFalseOrderBySequenceAsc(m29Id))
                    .thenReturn(Collections.emptyList());

            UpdateM29Request request = new UpdateM29Request(
                    LocalDate.of(2025, 7, 15), null, null, null, null, "Обновлённые заметки");

            M29Response response = m29Service.updateM29(m29Id, request);

            assertThat(testM29.getNotes()).isEqualTo("Обновлённые заметки");
            verify(auditService).logUpdate("M29Document", m29Id, "multiple", null, null);
        }

        @Test
        @DisplayName("Should reject update when not DRAFT")
        void shouldThrowException_whenUpdateNonDraft() {
            testM29.setStatus(M29Status.CONFIRMED);
            when(m29DocumentRepository.findById(m29Id)).thenReturn(Optional.of(testM29));

            UpdateM29Request request = new UpdateM29Request(
                    null, null, null, null, null, "Попытка");

            assertThatThrownBy(() -> m29Service.updateM29(m29Id, request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Редактирование М-29 возможно только в статусе Черновик");
        }
    }

    @Nested
    @DisplayName("M-29 Line Management")
    class M29LineTests {

        @Test
        @DisplayName("Should add line to M-29 in DRAFT status")
        void shouldAddLine_whenM29IsDraft() {
            CreateM29LineRequest request = new CreateM29LineRequest(
                    null, 1, "Цемент М500", new BigDecimal("1000"),
                    new BigDecimal("950"), "кг", null);

            when(m29DocumentRepository.findById(m29Id)).thenReturn(Optional.of(testM29));
            when(m29LineRepository.save(any(M29Line.class))).thenAnswer(inv -> {
                M29Line line = inv.getArgument(0);
                line.setId(UUID.randomUUID());
                line.setCreatedAt(Instant.now());
                return line;
            });

            M29LineResponse response = m29Service.addLine(m29Id, request);

            assertThat(response).isNotNull();
            assertThat(response.name()).isEqualTo("Цемент М500");
            verify(auditService).logCreate(eq("M29Line"), any(UUID.class));
        }

        @Test
        @DisplayName("Should reject adding line to non-DRAFT M-29")
        void shouldThrowException_whenAddLineToNonDraft() {
            testM29.setStatus(M29Status.APPROVED);
            CreateM29LineRequest request = new CreateM29LineRequest(
                    null, 1, "Материал", BigDecimal.ONE, BigDecimal.ONE, "шт", null);

            when(m29DocumentRepository.findById(m29Id)).thenReturn(Optional.of(testM29));

            assertThatThrownBy(() -> m29Service.addLine(m29Id, request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Редактирование М-29 возможно только в статусе Черновик");
        }

        @Test
        @DisplayName("Should remove M-29 line via soft delete")
        void shouldRemoveLine_whenDraft() {
            UUID lineId = UUID.randomUUID();
            M29Line line = M29Line.builder()
                    .m29Id(m29Id)
                    .name("Позиция")
                    .build();
            line.setId(lineId);
            line.setCreatedAt(Instant.now());

            when(m29LineRepository.findById(lineId)).thenReturn(Optional.of(line));
            when(m29DocumentRepository.findById(m29Id)).thenReturn(Optional.of(testM29));
            when(m29LineRepository.save(any(M29Line.class))).thenAnswer(inv -> inv.getArgument(0));

            m29Service.removeLine(lineId);

            assertThat(line.isDeleted()).isTrue();
            verify(auditService).logDelete("M29Line", lineId);
        }
    }

    @Nested
    @DisplayName("M-29 Status Transitions")
    class M29StatusTests {

        @Test
        @DisplayName("Should confirm M-29 from DRAFT")
        void shouldConfirmM29_whenDraft() {
            when(m29DocumentRepository.findById(m29Id)).thenReturn(Optional.of(testM29));
            when(m29DocumentRepository.save(any(M29Document.class))).thenAnswer(inv -> inv.getArgument(0));
            when(m29LineRepository.findByM29IdAndDeletedFalseOrderBySequenceAsc(m29Id))
                    .thenReturn(Collections.emptyList());

            M29Response response = m29Service.confirmM29(m29Id);

            assertThat(response.status()).isEqualTo(M29Status.CONFIRMED);
            verify(auditService).logStatusChange("M29Document", m29Id, "DRAFT", "CONFIRMED");
        }

        @Test
        @DisplayName("Should reject invalid M-29 status transition")
        void shouldThrowException_whenInvalidTransition() {
            when(m29DocumentRepository.findById(m29Id)).thenReturn(Optional.of(testM29));

            assertThatThrownBy(() -> m29Service.approveM29(m29Id))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно перевести М-29");
        }
    }
}
