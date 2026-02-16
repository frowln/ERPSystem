package com.privod.platform.modules.bim.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.bim.domain.PhotoComparison;
import com.privod.platform.modules.bim.repository.PhotoComparisonRepository;
import com.privod.platform.modules.bim.web.dto.CreatePhotoComparisonRequest;
import com.privod.platform.modules.bim.web.dto.PhotoComparisonResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PhotoComparisonService {

    private final PhotoComparisonRepository photoComparisonRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<PhotoComparisonResponse> listComparisons(UUID projectId, Pageable pageable) {
        if (projectId != null) {
            return photoComparisonRepository.findByProjectIdAndDeletedFalse(projectId, pageable)
                    .map(PhotoComparisonResponse::fromEntity);
        }
        return photoComparisonRepository.findByDeletedFalse(pageable)
                .map(PhotoComparisonResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public PhotoComparisonResponse getComparison(UUID id) {
        PhotoComparison comparison = getComparisonOrThrow(id);
        return PhotoComparisonResponse.fromEntity(comparison);
    }

    @Transactional
    public PhotoComparisonResponse createComparison(CreatePhotoComparisonRequest request) {
        PhotoComparison comparison = PhotoComparison.builder()
                .beforePhotoId(request.beforePhotoId())
                .afterPhotoId(request.afterPhotoId())
                .projectId(request.projectId())
                .title(request.title())
                .description(request.description())
                .build();

        comparison = photoComparisonRepository.save(comparison);
        auditService.logCreate("PhotoComparison", comparison.getId());

        log.info("Photo comparison created: {} ({})", comparison.getTitle(), comparison.getId());
        return PhotoComparisonResponse.fromEntity(comparison);
    }

    @Transactional
    public PhotoComparisonResponse updateComparison(UUID id, CreatePhotoComparisonRequest request) {
        PhotoComparison comparison = getComparisonOrThrow(id);

        comparison.setBeforePhotoId(request.beforePhotoId());
        comparison.setAfterPhotoId(request.afterPhotoId());
        comparison.setProjectId(request.projectId());
        comparison.setTitle(request.title());
        comparison.setDescription(request.description());

        comparison = photoComparisonRepository.save(comparison);
        auditService.logUpdate("PhotoComparison", comparison.getId(), "multiple", null, null);

        log.info("Photo comparison updated: {} ({})", comparison.getTitle(), comparison.getId());
        return PhotoComparisonResponse.fromEntity(comparison);
    }

    @Transactional
    public void deleteComparison(UUID id) {
        PhotoComparison comparison = getComparisonOrThrow(id);
        comparison.softDelete();
        photoComparisonRepository.save(comparison);
        auditService.logDelete("PhotoComparison", comparison.getId());

        log.info("Photo comparison deleted: {} ({})", comparison.getTitle(), comparison.getId());
    }

    private PhotoComparison getComparisonOrThrow(UUID id) {
        return photoComparisonRepository.findById(id)
                .filter(c -> !c.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Сравнение фото не найдено: " + id));
    }
}
