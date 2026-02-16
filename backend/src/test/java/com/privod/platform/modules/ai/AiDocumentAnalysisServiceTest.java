package com.privod.platform.modules.ai;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.ai.domain.AiDocumentAnalysis;
import com.privod.platform.modules.ai.domain.AnalysisStatus;
import com.privod.platform.modules.ai.domain.AnalysisType;
import com.privod.platform.modules.ai.repository.AiDocumentAnalysisRepository;
import com.privod.platform.modules.ai.service.AiDocumentAnalysisService;
import com.privod.platform.modules.ai.web.dto.AiDocumentAnalysisResponse;
import com.privod.platform.modules.ai.web.dto.CreateDocumentAnalysisRequest;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.DisplayName;
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
class AiDocumentAnalysisServiceTest {

    @Mock
    private AiDocumentAnalysisRepository analysisRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private AiDocumentAnalysisService analysisService;

    @Test
    @DisplayName("Should create document analysis with PENDING status")
    void create_SetsPendingStatus() {
        UUID documentId = UUID.randomUUID();
        CreateDocumentAnalysisRequest request = new CreateDocumentAnalysisRequest(documentId, AnalysisType.SUMMARY);

        when(analysisRepository.save(any(AiDocumentAnalysis.class))).thenAnswer(inv -> {
            AiDocumentAnalysis a = inv.getArgument(0);
            a.setId(UUID.randomUUID());
            a.setCreatedAt(Instant.now());
            return a;
        });

        AiDocumentAnalysisResponse response = analysisService.create(request);

        assertThat(response.status()).isEqualTo(AnalysisStatus.PENDING);
        assertThat(response.analysisType()).isEqualTo(AnalysisType.SUMMARY);
        assertThat(response.analysisTypeDisplayName()).isEqualTo("Резюме");
        assertThat(response.documentId()).isEqualTo(documentId);
        verify(auditService).logCreate(eq("AiDocumentAnalysis"), any(UUID.class));
    }

    @Test
    @DisplayName("Should find analysis by ID")
    void findById_Success() {
        UUID analysisId = UUID.randomUUID();
        AiDocumentAnalysis analysis = AiDocumentAnalysis.builder()
                .documentId(UUID.randomUUID())
                .analysisType(AnalysisType.CLASSIFY)
                .status(AnalysisStatus.COMPLETED)
                .confidence(0.95)
                .build();
        analysis.setId(analysisId);
        analysis.setCreatedAt(Instant.now());

        when(analysisRepository.findByIdAndDeletedFalse(analysisId)).thenReturn(Optional.of(analysis));

        AiDocumentAnalysisResponse response = analysisService.findById(analysisId);

        assertThat(response.confidence()).isEqualTo(0.95);
        assertThat(response.statusDisplayName()).isEqualTo("Завершён");
    }

    @Test
    @DisplayName("Should throw when analysis not found")
    void findById_NotFound() {
        UUID nonExistentId = UUID.randomUUID();
        when(analysisRepository.findByIdAndDeletedFalse(nonExistentId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> analysisService.findById(nonExistentId))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    @DisplayName("Should find analyses by document ID")
    void findByDocument_ReturnsList() {
        UUID documentId = UUID.randomUUID();
        AiDocumentAnalysis analysis = AiDocumentAnalysis.builder()
                .documentId(documentId)
                .analysisType(AnalysisType.EXTRACT_DATA)
                .status(AnalysisStatus.COMPLETED)
                .build();
        analysis.setId(UUID.randomUUID());
        analysis.setCreatedAt(Instant.now());

        when(analysisRepository.findByDocumentIdAndDeletedFalse(documentId)).thenReturn(List.of(analysis));

        List<AiDocumentAnalysisResponse> results = analysisService.findByDocument(documentId);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).analysisType()).isEqualTo(AnalysisType.EXTRACT_DATA);
    }
}
