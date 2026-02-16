package com.privod.platform.modules.closing.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.closing.domain.ClosingDocumentStatus;
import com.privod.platform.modules.closing.domain.Ks2Document;
import com.privod.platform.modules.closing.domain.Ks2Line;
import com.privod.platform.modules.closing.domain.Ks3Document;
import com.privod.platform.modules.closing.domain.Ks3Ks2Link;
import com.privod.platform.modules.closing.repository.Ks2DocumentRepository;
import com.privod.platform.modules.closing.repository.Ks2LineRepository;
import com.privod.platform.modules.closing.repository.Ks3DocumentRepository;
import com.privod.platform.modules.closing.repository.Ks3Ks2LinkRepository;
import com.privod.platform.modules.closing.web.dto.CreateKs2LineRequest;
import com.privod.platform.modules.closing.web.dto.CreateKs2Request;
import com.privod.platform.modules.closing.web.dto.CreateKs3Request;
import com.privod.platform.modules.closing.web.dto.Ks2LineResponse;
import com.privod.platform.modules.closing.web.dto.Ks2Response;
import com.privod.platform.modules.closing.web.dto.Ks3Response;
import com.privod.platform.modules.closing.web.dto.UpdateKs2Request;
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
class ClosingDocumentServiceTest {

    @Mock
    private Ks2DocumentRepository ks2DocumentRepository;

    @Mock
    private Ks2LineRepository ks2LineRepository;

    @Mock
    private Ks3DocumentRepository ks3DocumentRepository;

    @Mock
    private Ks3Ks2LinkRepository ks3Ks2LinkRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private ClosingDocumentService closingDocumentService;

    private UUID ks2Id;
    private UUID ks3Id;
    private UUID projectId;
    private UUID contractId;
    private Ks2Document testKs2;
    private Ks3Document testKs3;

    @BeforeEach
    void setUp() {
        ks2Id = UUID.randomUUID();
        ks3Id = UUID.randomUUID();
        projectId = UUID.randomUUID();
        contractId = UUID.randomUUID();

        testKs2 = Ks2Document.builder()
                .number("КС2-001")
                .documentDate(LocalDate.of(2025, 6, 15))
                .projectId(projectId)
                .contractId(contractId)
                .status(ClosingDocumentStatus.DRAFT)
                .totalAmount(BigDecimal.ZERO)
                .totalQuantity(BigDecimal.ZERO)
                .build();
        testKs2.setId(ks2Id);
        testKs2.setCreatedAt(Instant.now());

        testKs3 = Ks3Document.builder()
                .number("КС3-001")
                .documentDate(LocalDate.of(2025, 6, 30))
                .periodFrom(LocalDate.of(2025, 6, 1))
                .periodTo(LocalDate.of(2025, 6, 30))
                .projectId(projectId)
                .contractId(contractId)
                .retentionPercent(new BigDecimal("5.00"))
                .status(ClosingDocumentStatus.DRAFT)
                .totalAmount(BigDecimal.ZERO)
                .build();
        testKs3.setId(ks3Id);
        testKs3.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("KS-2 CRUD")
    class Ks2CrudTests {

        @Test
        @DisplayName("Should create KS-2 document with DRAFT status")
        void shouldCreateKs2_whenValidInput() {
            CreateKs2Request request = new CreateKs2Request(
                    "КС2-002", LocalDate.of(2025, 7, 1), projectId, contractId, null);

            when(ks2DocumentRepository.save(any(Ks2Document.class))).thenAnswer(inv -> {
                Ks2Document doc = inv.getArgument(0);
                doc.setId(UUID.randomUUID());
                doc.setCreatedAt(Instant.now());
                return doc;
            });

            Ks2Response response = closingDocumentService.createKs2(request);

            assertThat(response.status()).isEqualTo(ClosingDocumentStatus.DRAFT);
            verify(auditService).logCreate(eq("Ks2Document"), any(UUID.class));
        }

        @Test
        @DisplayName("Should find KS-2 by ID")
        void shouldReturnKs2_whenExists() {
            when(ks2DocumentRepository.findById(ks2Id)).thenReturn(Optional.of(testKs2));
            when(ks2LineRepository.findByKs2IdAndDeletedFalseOrderBySequenceAsc(ks2Id))
                    .thenReturn(Collections.emptyList());

            Ks2Response response = closingDocumentService.getKs2(ks2Id);

            assertThat(response).isNotNull();
            assertThat(response.number()).isEqualTo("КС2-001");
        }

        @Test
        @DisplayName("Should throw when KS-2 not found")
        void shouldThrowException_whenKs2NotFound() {
            UUID nonExistent = UUID.randomUUID();
            when(ks2DocumentRepository.findById(nonExistent)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> closingDocumentService.getKs2(nonExistent))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Документ КС-2 не найден");
        }

        @Test
        @DisplayName("Should reject update when KS-2 is not DRAFT")
        void shouldThrowException_whenUpdateNonDraftKs2() {
            testKs2.setStatus(ClosingDocumentStatus.SUBMITTED);
            when(ks2DocumentRepository.findById(ks2Id)).thenReturn(Optional.of(testKs2));

            UpdateKs2Request request = new UpdateKs2Request(
                    "КС2-NEW", null, null, null, null);

            assertThatThrownBy(() -> closingDocumentService.updateKs2(ks2Id, request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Редактирование КС-2 возможно только в статусе Черновик");
        }
    }

    @Nested
    @DisplayName("KS-2 Lines")
    class Ks2LineTests {

        @Test
        @DisplayName("Should add line to KS-2 in DRAFT status")
        void shouldAddLine_whenKs2IsDraft() {
            CreateKs2LineRequest request = new CreateKs2LineRequest(
                    null, 1, "Бетонирование", new BigDecimal("50"),
                    new BigDecimal("3000"), "м3", null);

            when(ks2DocumentRepository.findById(ks2Id)).thenReturn(Optional.of(testKs2));
            when(ks2LineRepository.save(any(Ks2Line.class))).thenAnswer(inv -> {
                Ks2Line line = inv.getArgument(0);
                line.setId(UUID.randomUUID());
                line.setCreatedAt(Instant.now());
                return line;
            });
            when(ks2LineRepository.sumAmountByKs2Id(ks2Id)).thenReturn(new BigDecimal("150000"));
            when(ks2LineRepository.sumQuantityByKs2Id(ks2Id)).thenReturn(new BigDecimal("50"));
            when(ks2DocumentRepository.save(any(Ks2Document.class))).thenAnswer(inv -> inv.getArgument(0));

            Ks2LineResponse response = closingDocumentService.addKs2Line(ks2Id, request);

            assertThat(response).isNotNull();
            assertThat(response.name()).isEqualTo("Бетонирование");
            verify(auditService).logCreate(eq("Ks2Line"), any(UUID.class));
        }

        @Test
        @DisplayName("Should reject adding line when KS-2 not DRAFT")
        void shouldThrowException_whenAddLineToNonDraftKs2() {
            testKs2.setStatus(ClosingDocumentStatus.SIGNED);
            CreateKs2LineRequest request = new CreateKs2LineRequest(
                    null, 1, "Работа", BigDecimal.ONE, BigDecimal.ONE, "шт", null);

            when(ks2DocumentRepository.findById(ks2Id)).thenReturn(Optional.of(testKs2));

            assertThatThrownBy(() -> closingDocumentService.addKs2Line(ks2Id, request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Редактирование КС-2 возможно только в статусе Черновик");
        }
    }

    @Nested
    @DisplayName("KS-2 Status Transitions")
    class Ks2StatusTests {

        @Test
        @DisplayName("Should reject submit KS-2 without lines")
        void shouldThrowException_whenSubmitKs2WithoutLines() {
            when(ks2DocumentRepository.findById(ks2Id)).thenReturn(Optional.of(testKs2));
            when(ks2LineRepository.findByKs2IdAndDeletedFalseOrderBySequenceAsc(ks2Id))
                    .thenReturn(Collections.emptyList());

            assertThatThrownBy(() -> closingDocumentService.submitKs2(ks2Id))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно отправить КС-2 без строк работ");
        }

        @Test
        @DisplayName("Should reject invalid KS-2 status transition")
        void shouldThrowException_whenInvalidKs2Transition() {
            when(ks2DocumentRepository.findById(ks2Id)).thenReturn(Optional.of(testKs2));

            assertThatThrownBy(() -> closingDocumentService.signKs2(ks2Id))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно подписать КС-2");
        }
    }

    @Nested
    @DisplayName("KS-3 CRUD")
    class Ks3CrudTests {

        @Test
        @DisplayName("Should create KS-3 document with DRAFT status")
        void shouldCreateKs3_whenValidInput() {
            CreateKs3Request request = new CreateKs3Request(
                    "КС3-002", LocalDate.of(2025, 7, 31),
                    LocalDate.of(2025, 7, 1), LocalDate.of(2025, 7, 31),
                    projectId, contractId, null, null);

            when(ks3DocumentRepository.save(any(Ks3Document.class))).thenAnswer(inv -> {
                Ks3Document doc = inv.getArgument(0);
                doc.setId(UUID.randomUUID());
                doc.setCreatedAt(Instant.now());
                return doc;
            });

            Ks3Response response = closingDocumentService.createKs3(request);

            assertThat(response.status()).isEqualTo(ClosingDocumentStatus.DRAFT);
            verify(auditService).logCreate(eq("Ks3Document"), any(UUID.class));
        }

        @Test
        @DisplayName("Should reject linking duplicate KS-2 to KS-3")
        void shouldThrowException_whenDuplicateKs2Link() {
            when(ks3DocumentRepository.findById(ks3Id)).thenReturn(Optional.of(testKs3));
            when(ks2DocumentRepository.findById(ks2Id)).thenReturn(Optional.of(testKs2));
            when(ks3Ks2LinkRepository.existsByKs3IdAndKs2IdAndDeletedFalse(ks3Id, ks2Id)).thenReturn(true);

            assertThatThrownBy(() -> closingDocumentService.linkKs2ToKs3(ks3Id, ks2Id))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("КС-2 уже привязан к данному КС-3");
        }

        @Test
        @DisplayName("Should reject submit KS-3 without linked KS-2")
        void shouldThrowException_whenSubmitKs3WithoutLinks() {
            when(ks3DocumentRepository.findById(ks3Id)).thenReturn(Optional.of(testKs3));
            when(ks3Ks2LinkRepository.findByKs3IdAndDeletedFalse(ks3Id)).thenReturn(Collections.emptyList());

            assertThatThrownBy(() -> closingDocumentService.submitKs3(ks3Id))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно отправить КС-3 без привязанных документов КС-2");
        }
    }
}
