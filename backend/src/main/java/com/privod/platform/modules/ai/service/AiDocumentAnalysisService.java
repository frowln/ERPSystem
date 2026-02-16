package com.privod.platform.modules.ai.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.ai.domain.AiDocumentAnalysis;
import com.privod.platform.modules.ai.domain.AnalysisStatus;
import com.privod.platform.modules.ai.repository.AiDocumentAnalysisRepository;
import com.privod.platform.modules.ai.web.dto.AiDocumentAnalysisResponse;
import com.privod.platform.modules.ai.web.dto.CreateDocumentAnalysisRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiDocumentAnalysisService {

    private final AiDocumentAnalysisRepository analysisRepository;
    private final AuditService auditService;

    @Transactional
    public AiDocumentAnalysisResponse create(CreateDocumentAnalysisRequest request) {
        AiDocumentAnalysis analysis = AiDocumentAnalysis.builder()
                .documentId(request.documentId())
                .analysisType(request.analysisType())
                .status(AnalysisStatus.PENDING)
                .build();

        analysis = analysisRepository.save(analysis);
        auditService.logCreate("AiDocumentAnalysis", analysis.getId());

        log.info("Document analysis created: type={}, documentId={}", request.analysisType(), request.documentId());
        return AiDocumentAnalysisResponse.fromEntity(analysis);
    }

    @Transactional(readOnly = true)
    public AiDocumentAnalysisResponse findById(UUID id) {
        AiDocumentAnalysis analysis = getAnalysisOrThrow(id);
        return AiDocumentAnalysisResponse.fromEntity(analysis);
    }

    @Transactional(readOnly = true)
    public List<AiDocumentAnalysisResponse> findByDocument(UUID documentId) {
        return analysisRepository.findByDocumentIdAndDeletedFalse(documentId)
                .stream()
                .map(AiDocumentAnalysisResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<AiDocumentAnalysisResponse> findByStatus(AnalysisStatus status, Pageable pageable) {
        return analysisRepository.findByStatusAndDeletedFalse(status, pageable)
                .map(AiDocumentAnalysisResponse::fromEntity);
    }

    private AiDocumentAnalysis getAnalysisOrThrow(UUID id) {
        return analysisRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Document analysis not found: " + id));
    }
}
