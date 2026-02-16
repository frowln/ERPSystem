package com.privod.platform.modules.analytics.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.analytics.domain.AbcCategory;
import com.privod.platform.modules.analytics.domain.AbcXyzAnalysis;
import com.privod.platform.modules.analytics.domain.XyzCategory;
import com.privod.platform.modules.analytics.repository.AbcXyzAnalysisRepository;
import com.privod.platform.modules.analytics.web.dto.AbcXyzAnalysisResponse;
import com.privod.platform.modules.analytics.web.dto.CreateAbcXyzAnalysisRequest;
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
public class AbcXyzService {

    private final AbcXyzAnalysisRepository analysisRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public AbcXyzAnalysisResponse findById(UUID id) {
        AbcXyzAnalysis analysis = getAnalysisOrThrow(id);
        return AbcXyzAnalysisResponse.fromEntity(analysis);
    }

    @Transactional(readOnly = true)
    public Page<AbcXyzAnalysisResponse> findByProject(UUID projectId, Pageable pageable) {
        return analysisRepository.findByProjectIdAndDeletedFalseOrderByAnalysisDateDesc(projectId, pageable)
                .map(AbcXyzAnalysisResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public Page<AbcXyzAnalysisResponse> findByFilters(UUID projectId, String entityType,
                                                       AbcCategory abcCategory, XyzCategory xyzCategory,
                                                       Pageable pageable) {
        return analysisRepository.findByFilters(projectId, entityType, abcCategory, xyzCategory, pageable)
                .map(AbcXyzAnalysisResponse::fromEntity);
    }

    @Transactional
    public AbcXyzAnalysisResponse create(CreateAbcXyzAnalysisRequest request) {
        AbcXyzAnalysis analysis = AbcXyzAnalysis.builder()
                .projectId(request.projectId())
                .analysisDate(request.analysisDate())
                .entityType(request.entityType())
                .entityId(request.entityId())
                .entityName(request.entityName())
                .abcCategory(request.abcCategory())
                .xyzCategory(request.xyzCategory())
                .totalValue(request.totalValue())
                .percentOfTotal(request.percentOfTotal())
                .variationCoefficient(request.variationCoefficient())
                .frequency(request.frequency() != null ? request.frequency() : 0)
                .build();

        analysis = analysisRepository.save(analysis);
        auditService.logCreate("AbcXyzAnalysis", analysis.getId());

        log.info("ABC/XYZ analysis created for project {}: {} - {}/{} ({})",
                analysis.getProjectId(), analysis.getEntityName(),
                analysis.getAbcCategory(), analysis.getXyzCategory(), analysis.getId());
        return AbcXyzAnalysisResponse.fromEntity(analysis);
    }

    @Transactional
    public List<AbcXyzAnalysisResponse> createBatch(List<CreateAbcXyzAnalysisRequest> requests) {
        return requests.stream()
                .map(this::create)
                .toList();
    }

    @Transactional
    public void delete(UUID id) {
        AbcXyzAnalysis analysis = getAnalysisOrThrow(id);
        analysis.softDelete();
        analysisRepository.save(analysis);
        auditService.logDelete("AbcXyzAnalysis", id);
        log.info("ABC/XYZ analysis soft-deleted: {} ({})", analysis.getEntityName(), id);
    }

    private AbcXyzAnalysis getAnalysisOrThrow(UUID id) {
        return analysisRepository.findById(id)
                .filter(a -> !a.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("ABC/XYZ анализ не найден: " + id));
    }
}
