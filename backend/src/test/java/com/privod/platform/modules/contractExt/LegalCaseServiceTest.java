package com.privod.platform.modules.contractExt;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.legal.domain.LegalCase;
import com.privod.platform.modules.contractExt.domain.LegalCaseStatus;
import com.privod.platform.modules.contractExt.domain.LegalDocument;
import com.privod.platform.modules.contractExt.repository.LegalCaseRepository;
import com.privod.platform.modules.contractExt.repository.LegalDocumentRepository;
import com.privod.platform.modules.contractExt.service.LegalCaseService;
import com.privod.platform.modules.contractExt.web.dto.CreateLegalCaseRequest;
import com.privod.platform.modules.contractExt.web.dto.CreateLegalDocumentRequest;
import com.privod.platform.modules.contractExt.web.dto.LegalCaseResponse;
import com.privod.platform.modules.contractExt.web.dto.LegalDocumentResponse;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
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
class LegalCaseServiceTest {

    @Mock
    private LegalCaseRepository caseRepository;

    @Mock
    private LegalDocumentRepository documentRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private LegalCaseService legalCaseService;

    private UUID projectId;
    private UUID contractId;
    private UUID caseId;
    private LegalCase testCase;

    @BeforeEach
    void setUp() {
        projectId = UUID.randomUUID();
        contractId = UUID.randomUUID();
        caseId = UUID.randomUUID();

        testCase = LegalCase.builder()
                .projectId(projectId)
                .contractId(contractId)
                .caseNumber("А40-123456/2025")
                .court("Арбитражный суд г. Москвы")
                .subject("Взыскание неустойки за нарушение сроков строительства")
                .claimAmount(new BigDecimal("2500000.00"))
                .status(LegalCaseStatus.PREPARATION)
                .lawyerId(UUID.randomUUID())
                .build();
        testCase.setId(caseId);
        testCase.setCreatedAt(Instant.now());
    }

    @Test
    @DisplayName("Should create legal case with PREPARATION status")
    void createLegalCase_Success() {
        CreateLegalCaseRequest request = new CreateLegalCaseRequest(
                projectId, contractId, "А40-789012/2025",
                "Арбитражный суд МО", "Признание контракта недействительным",
                new BigDecimal("1000000.00"), LocalDate.of(2025, 8, 1),
                LocalDate.of(2025, 9, 15), UUID.randomUUID());

        when(caseRepository.save(any(LegalCase.class))).thenAnswer(inv -> {
            LegalCase c = inv.getArgument(0);
            c.setId(UUID.randomUUID());
            c.setCreatedAt(Instant.now());
            return c;
        });

        LegalCaseResponse response = legalCaseService.create(request);

        assertThat(response.status()).isEqualTo(LegalCaseStatus.PREPARATION);
        assertThat(response.caseNumber()).isEqualTo("А40-789012/2025");
        assertThat(response.statusDisplayName()).isEqualTo("Подготовка");
        verify(auditService).logCreate(eq("LegalCase"), any(UUID.class));
    }

    @Test
    @DisplayName("Should change legal case status")
    void changeStatus_Success() {
        when(caseRepository.findById(caseId)).thenReturn(Optional.of(testCase));
        when(caseRepository.save(any(LegalCase.class))).thenAnswer(inv -> inv.getArgument(0));

        LegalCaseResponse response = legalCaseService.changeStatus(caseId, LegalCaseStatus.FILED);

        assertThat(response.status()).isEqualTo(LegalCaseStatus.FILED);
        verify(auditService).logStatusChange("LegalCase", caseId, "PREPARATION", "FILED");
    }

    @Test
    @DisplayName("Should create legal document")
    void createDocument_Success() {
        when(caseRepository.findById(caseId)).thenReturn(Optional.of(testCase));
        when(documentRepository.save(any(LegalDocument.class))).thenAnswer(inv -> {
            LegalDocument d = inv.getArgument(0);
            d.setId(UUID.randomUUID());
            d.setCreatedAt(Instant.now());
            return d;
        });

        CreateLegalDocumentRequest request = new CreateLegalDocumentRequest(
                caseId, "Исковое заявление", "CLAIM",
                "https://storage.example.com/claim.pdf", UUID.randomUUID());

        LegalDocumentResponse response = legalCaseService.createDocument(request);

        assertThat(response.title()).isEqualTo("Исковое заявление");
        assertThat(response.documentType()).isEqualTo("CLAIM");
        verify(auditService).logCreate(eq("LegalDocument"), any(UUID.class));
    }

    @Test
    @DisplayName("Should list documents for a legal case")
    void listDocuments_Success() {
        LegalDocument doc = LegalDocument.builder()
                .caseId(caseId)
                .title("Ходатайство")
                .documentType("MOTION")
                .fileUrl("https://storage.example.com/motion.pdf")
                .uploadedAt(Instant.now())
                .build();
        doc.setId(UUID.randomUUID());
        doc.setCreatedAt(Instant.now());

        when(documentRepository.findByCaseIdAndDeletedFalseOrderByUploadedAtDesc(caseId))
                .thenReturn(List.of(doc));

        List<LegalDocumentResponse> documents = legalCaseService.listDocuments(caseId);

        assertThat(documents).hasSize(1);
        assertThat(documents.get(0).title()).isEqualTo("Ходатайство");
    }

    @Test
    @DisplayName("Should throw when legal case not found")
    void getById_NotFound() {
        UUID nonExistentId = UUID.randomUUID();
        when(caseRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> legalCaseService.getById(nonExistentId))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Судебное дело не найдено");
    }
}
