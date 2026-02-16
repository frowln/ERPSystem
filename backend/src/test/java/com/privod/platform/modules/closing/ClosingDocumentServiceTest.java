package com.privod.platform.modules.closing;

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
import com.privod.platform.modules.closing.service.ClosingDocumentService;
import com.privod.platform.modules.closing.web.dto.CreateKs2LineRequest;
import com.privod.platform.modules.closing.web.dto.CreateKs2Request;
import com.privod.platform.modules.closing.web.dto.CreateKs3Request;
import com.privod.platform.modules.closing.web.dto.Ks2LineResponse;
import com.privod.platform.modules.closing.web.dto.Ks2Response;
import com.privod.platform.modules.closing.web.dto.Ks3Response;
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
                .number("001")
                .documentDate(LocalDate.of(2025, 6, 15))
                .name("КС-2 №001 от 2025-06-15")
                .projectId(projectId)
                .contractId(contractId)
                .status(ClosingDocumentStatus.DRAFT)
                .totalAmount(BigDecimal.ZERO)
                .totalQuantity(BigDecimal.ZERO)
                .build();
        testKs2.setId(ks2Id);
        testKs2.setCreatedAt(Instant.now());

        testKs3 = Ks3Document.builder()
                .number("001")
                .documentDate(LocalDate.of(2025, 6, 30))
                .name("КС-3 №001 от 2025-06-30")
                .projectId(projectId)
                .contractId(contractId)
                .status(ClosingDocumentStatus.DRAFT)
                .retentionPercent(new BigDecimal("5.00"))
                .build();
        testKs3.setId(ks3Id);
        testKs3.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("KS-2 Create")
    class CreateKs2Tests {

        @Test
        @DisplayName("Should create KS-2 document with DRAFT status")
        void createKs2_Success() {
            CreateKs2Request request = new CreateKs2Request(
                    "002", LocalDate.of(2025, 7, 1), projectId, contractId, "Test notes");

            when(ks2DocumentRepository.save(any(Ks2Document.class))).thenAnswer(invocation -> {
                Ks2Document doc = invocation.getArgument(0);
                doc.setId(UUID.randomUUID());
                doc.setCreatedAt(Instant.now());
                return doc;
            });

            Ks2Response response = closingDocumentService.createKs2(request);

            assertThat(response.status()).isEqualTo(ClosingDocumentStatus.DRAFT);
            assertThat(response.number()).isEqualTo("002");
            assertThat(response.name()).contains("КС-2");
            assertThat(response.lines()).isEmpty();
            verify(auditService).logCreate(eq("Ks2Document"), any(UUID.class));
        }
    }

    @Nested
    @DisplayName("KS-2 Lines")
    class Ks2LineTests {

        @Test
        @DisplayName("Should add line to KS-2 and compute amount")
        void addKs2Line_ComputesAmount() {
            when(ks2DocumentRepository.findById(ks2Id)).thenReturn(Optional.of(testKs2));
            when(ks2LineRepository.save(any(Ks2Line.class))).thenAnswer(invocation -> {
                Ks2Line line = invocation.getArgument(0);
                line.setId(UUID.randomUUID());
                line.setCreatedAt(Instant.now());
                return line;
            });
            when(ks2LineRepository.sumAmountByKs2Id(ks2Id)).thenReturn(new BigDecimal("15000.00"));
            when(ks2LineRepository.sumQuantityByKs2Id(ks2Id)).thenReturn(new BigDecimal("10.000"));

            CreateKs2LineRequest request = new CreateKs2LineRequest(
                    null, 1, "Кладка стен", new BigDecimal("10.000"),
                    new BigDecimal("1500.00"), "м3", null);

            Ks2LineResponse response = closingDocumentService.addKs2Line(ks2Id, request);

            assertThat(response.name()).isEqualTo("Кладка стен");
            assertThat(response.amount()).isEqualByComparingTo(new BigDecimal("15000.000"));
            verify(auditService).logCreate(eq("Ks2Line"), any(UUID.class));
        }
    }

    @Nested
    @DisplayName("KS-2 Workflow")
    class Ks2WorkflowTests {

        @Test
        @DisplayName("Should submit KS-2 when it has lines")
        void submitKs2_WithLines_Success() {
            Ks2Line line = Ks2Line.builder()
                    .ks2Id(ks2Id)
                    .name("Test work")
                    .quantity(new BigDecimal("5.000"))
                    .unitPrice(new BigDecimal("100.00"))
                    .amount(new BigDecimal("500.00"))
                    .build();
            line.setId(UUID.randomUUID());
            line.setCreatedAt(Instant.now());

            when(ks2DocumentRepository.findById(ks2Id)).thenReturn(Optional.of(testKs2));
            when(ks2LineRepository.findByKs2IdAndDeletedFalseOrderBySequenceAsc(ks2Id))
                    .thenReturn(List.of(line));
            when(ks2DocumentRepository.save(any(Ks2Document.class))).thenReturn(testKs2);

            Ks2Response response = closingDocumentService.submitKs2(ks2Id);

            assertThat(response).isNotNull();
            verify(auditService).logStatusChange("Ks2Document", ks2Id, "DRAFT", "SUBMITTED");
        }

        @Test
        @DisplayName("Should fail to submit KS-2 without lines")
        void submitKs2_NoLines_Fails() {
            when(ks2DocumentRepository.findById(ks2Id)).thenReturn(Optional.of(testKs2));
            when(ks2LineRepository.findByKs2IdAndDeletedFalseOrderBySequenceAsc(ks2Id))
                    .thenReturn(List.of());

            assertThatThrownBy(() -> closingDocumentService.submitKs2(ks2Id))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("без строк");
        }

        @Test
        @DisplayName("Should sign KS-2 from SUBMITTED status")
        void signKs2_FromSubmitted_Success() {
            testKs2.setStatus(ClosingDocumentStatus.SUBMITTED);
            when(ks2DocumentRepository.findById(ks2Id)).thenReturn(Optional.of(testKs2));
            when(ks2DocumentRepository.save(any(Ks2Document.class))).thenAnswer(inv -> inv.getArgument(0));
            when(ks2LineRepository.findByKs2IdAndDeletedFalseOrderBySequenceAsc(ks2Id))
                    .thenReturn(List.of());

            closingDocumentService.signKs2(ks2Id);

            assertThat(testKs2.getStatus()).isEqualTo(ClosingDocumentStatus.SIGNED);
            assertThat(testKs2.getSignedAt()).isNotNull();
        }
    }

    @Nested
    @DisplayName("KS-3")
    class Ks3Tests {

        @Test
        @DisplayName("Should create KS-3 document")
        void createKs3_Success() {
            CreateKs3Request request = new CreateKs3Request(
                    "001", LocalDate.of(2025, 6, 30),
                    LocalDate.of(2025, 6, 1), LocalDate.of(2025, 6, 30),
                    projectId, contractId, new BigDecimal("5.00"), "Monthly report");

            when(ks3DocumentRepository.save(any(Ks3Document.class))).thenAnswer(invocation -> {
                Ks3Document doc = invocation.getArgument(0);
                doc.setId(UUID.randomUUID());
                doc.setCreatedAt(Instant.now());
                return doc;
            });

            Ks3Response response = closingDocumentService.createKs3(request);

            assertThat(response.status()).isEqualTo(ClosingDocumentStatus.DRAFT);
            assertThat(response.name()).contains("КС-3");
            assertThat(response.retentionPercent()).isEqualByComparingTo(new BigDecimal("5.00"));
            verify(auditService).logCreate(eq("Ks3Document"), any(UUID.class));
        }

        @Test
        @DisplayName("Should link KS-2 to KS-3")
        void linkKs2ToKs3_Success() {
            when(ks3DocumentRepository.findById(ks3Id)).thenReturn(Optional.of(testKs3));
            when(ks2DocumentRepository.findById(ks2Id)).thenReturn(Optional.of(testKs2));
            when(ks3Ks2LinkRepository.existsByKs3IdAndKs2IdAndDeletedFalse(ks3Id, ks2Id)).thenReturn(false);
            when(ks3Ks2LinkRepository.save(any(Ks3Ks2Link.class))).thenAnswer(inv -> {
                Ks3Ks2Link link = inv.getArgument(0);
                link.setId(UUID.randomUUID());
                return link;
            });
            when(ks3Ks2LinkRepository.findByKs3IdAndDeletedFalse(ks3Id))
                    .thenReturn(List.of(Ks3Ks2Link.builder().ks3Id(ks3Id).ks2Id(ks2Id).build()));
            when(ks3DocumentRepository.save(any(Ks3Document.class))).thenReturn(testKs3);

            Ks3Response response = closingDocumentService.linkKs2ToKs3(ks3Id, ks2Id);

            assertThat(response).isNotNull();
        }

        @Test
        @DisplayName("Should auto-fill signed KS-2 into KS-3")
        void autoFillKs2_LinksSigned() {
            Ks2Document signedKs2 = Ks2Document.builder()
                    .number("003")
                    .documentDate(LocalDate.now())
                    .projectId(projectId)
                    .contractId(contractId)
                    .status(ClosingDocumentStatus.SIGNED)
                    .totalAmount(new BigDecimal("50000.00"))
                    .build();
            signedKs2.setId(UUID.randomUUID());
            signedKs2.setCreatedAt(Instant.now());

            when(ks3DocumentRepository.findById(ks3Id)).thenReturn(Optional.of(testKs3));
            when(ks2DocumentRepository.findAll(any(org.springframework.data.jpa.domain.Specification.class)))
                    .thenReturn(List.of(signedKs2));
            when(ks3Ks2LinkRepository.existsByKs3IdAndKs2IdAndDeletedFalse(ks3Id, signedKs2.getId()))
                    .thenReturn(false);
            when(ks3Ks2LinkRepository.save(any(Ks3Ks2Link.class))).thenAnswer(inv -> {
                Ks3Ks2Link link = inv.getArgument(0);
                link.setId(UUID.randomUUID());
                return link;
            });
            when(ks3Ks2LinkRepository.findByKs3IdAndDeletedFalse(ks3Id))
                    .thenReturn(List.of(Ks3Ks2Link.builder().ks3Id(ks3Id).ks2Id(signedKs2.getId()).build()));
            when(ks2DocumentRepository.findById(signedKs2.getId())).thenReturn(Optional.of(signedKs2));
            when(ks3DocumentRepository.save(any(Ks3Document.class))).thenReturn(testKs3);

            Ks3Response response = closingDocumentService.autoFillKs2(ks3Id);

            assertThat(response).isNotNull();
            verify(ks3Ks2LinkRepository).save(any(Ks3Ks2Link.class));
        }
    }
}
