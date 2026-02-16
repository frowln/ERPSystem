package com.privod.platform.modules.design.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.design.domain.DesignReview;
import com.privod.platform.modules.design.domain.DesignReviewStatus;
import com.privod.platform.modules.design.domain.DesignSection;
import com.privod.platform.modules.design.domain.DesignVersion;
import com.privod.platform.modules.design.domain.DesignVersionStatus;
import com.privod.platform.modules.design.repository.DesignReviewRepository;
import com.privod.platform.modules.design.repository.DesignSectionRepository;
import com.privod.platform.modules.design.repository.DesignVersionRepository;
import com.privod.platform.modules.design.web.dto.CreateDesignReviewRequest;
import com.privod.platform.modules.design.web.dto.CreateDesignSectionRequest;
import com.privod.platform.modules.design.web.dto.CreateDesignVersionRequest;
import com.privod.platform.modules.design.web.dto.DesignReviewResponse;
import com.privod.platform.modules.design.web.dto.DesignSectionResponse;
import com.privod.platform.modules.design.web.dto.DesignVersionResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class DesignService {

    private final DesignVersionRepository versionRepository;
    private final DesignReviewRepository reviewRepository;
    private final DesignSectionRepository sectionRepository;
    private final AuditService auditService;

    // ========================================================================
    // Design Versions
    // ========================================================================

    @Transactional(readOnly = true)
    public Page<DesignVersionResponse> listVersions(UUID projectId, DesignVersionStatus status, Pageable pageable) {
        if (projectId != null && status != null) {
            return versionRepository.findByProjectIdAndStatusAndDeletedFalse(projectId, status, pageable)
                    .map(DesignVersionResponse::fromEntity);
        }
        if (projectId != null) {
            return versionRepository.findByProjectIdAndDeletedFalse(projectId, pageable)
                    .map(DesignVersionResponse::fromEntity);
        }
        return versionRepository.findByDeletedFalse(pageable)
                .map(DesignVersionResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public DesignVersionResponse getVersion(UUID id) {
        DesignVersion version = getVersionOrThrow(id);
        return DesignVersionResponse.fromEntity(version);
    }

    @Transactional(readOnly = true)
    public List<DesignVersionResponse> getVersionsByDocument(UUID documentId) {
        return versionRepository.findByDocumentIdAndDeletedFalseOrderByCreatedAtDesc(documentId)
                .stream()
                .map(DesignVersionResponse::fromEntity)
                .toList();
    }

    @Transactional
    public DesignVersionResponse createVersion(CreateDesignVersionRequest request) {
        DesignVersion version = DesignVersion.builder()
                .projectId(request.projectId())
                .documentId(request.documentId())
                .versionNumber(request.versionNumber())
                .title(request.title())
                .discipline(request.discipline())
                .author(request.author())
                .reviewDeadline(request.reviewDeadline())
                .fileUrl(request.fileUrl())
                .fileSize(request.fileSize())
                .changeDescription(request.changeDescription())
                .status(DesignVersionStatus.DRAFT)
                .build();

        version = versionRepository.save(version);
        auditService.logCreate("DesignVersion", version.getId());

        log.info("Версия проектной документации создана: {} v{} ({})",
                version.getTitle(), version.getVersionNumber(), version.getId());
        return DesignVersionResponse.fromEntity(version);
    }

    @Transactional
    public DesignVersionResponse updateVersion(UUID id, CreateDesignVersionRequest request) {
        DesignVersion version = getVersionOrThrow(id);

        if (request.title() != null) version.setTitle(request.title());
        if (request.discipline() != null) version.setDiscipline(request.discipline());
        if (request.author() != null) version.setAuthor(request.author());
        if (request.reviewDeadline() != null) version.setReviewDeadline(request.reviewDeadline());
        if (request.fileUrl() != null) version.setFileUrl(request.fileUrl());
        if (request.fileSize() != null) version.setFileSize(request.fileSize());
        if (request.changeDescription() != null) version.setChangeDescription(request.changeDescription());

        version = versionRepository.save(version);
        auditService.logUpdate("DesignVersion", version.getId(), "multiple", null, null);

        log.info("Версия проектной документации обновлена: {} v{} ({})",
                version.getTitle(), version.getVersionNumber(), version.getId());
        return DesignVersionResponse.fromEntity(version);
    }

    @Transactional
    public DesignVersionResponse transitionVersionStatus(UUID id, DesignVersionStatus targetStatus) {
        DesignVersion version = getVersionOrThrow(id);
        DesignVersionStatus oldStatus = version.getStatus();

        if (!version.canTransitionTo(targetStatus)) {
            throw new IllegalStateException(
                    String.format("Невозможно перевести версию из статуса %s в %s",
                            oldStatus.getDisplayName(), targetStatus.getDisplayName()));
        }

        version.setStatus(targetStatus);
        version = versionRepository.save(version);
        auditService.logStatusChange("DesignVersion", version.getId(), oldStatus.name(), targetStatus.name());

        log.info("Версия {} переведена: {} -> {}", version.getVersionNumber(), oldStatus, targetStatus);
        return DesignVersionResponse.fromEntity(version);
    }

    @Transactional
    public void deleteVersion(UUID id) {
        DesignVersion version = getVersionOrThrow(id);
        version.softDelete();
        versionRepository.save(version);
        auditService.logDelete("DesignVersion", id);
        log.info("Версия проектной документации удалена: {}", id);
    }

    // ========================================================================
    // Design Reviews
    // ========================================================================

    @Transactional(readOnly = true)
    public List<DesignReviewResponse> getReviewsForVersion(UUID designVersionId) {
        return reviewRepository.findByDesignVersionIdAndDeletedFalse(designVersionId)
                .stream()
                .map(DesignReviewResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<DesignReviewResponse> listReviews(Pageable pageable) {
        return reviewRepository.findByDeletedFalse(pageable)
                .map(DesignReviewResponse::fromEntity);
    }

    @Transactional
    public DesignReviewResponse createReview(CreateDesignReviewRequest request) {
        getVersionOrThrow(request.designVersionId());

        DesignReview review = DesignReview.builder()
                .designVersionId(request.designVersionId())
                .reviewerId(request.reviewerId())
                .reviewerName(request.reviewerName())
                .comments(request.comments())
                .status(DesignReviewStatus.PENDING)
                .build();

        review = reviewRepository.save(review);
        auditService.logCreate("DesignReview", review.getId());

        log.info("Рецензия создана: {} для версии {}", review.getId(), request.designVersionId());
        return DesignReviewResponse.fromEntity(review);
    }

    @Transactional
    public DesignReviewResponse completeReview(UUID id, DesignReviewStatus targetStatus, String comments) {
        DesignReview review = getReviewOrThrow(id);

        if (review.getStatus() != DesignReviewStatus.PENDING) {
            throw new IllegalStateException("Рецензия уже завершена");
        }

        review.setStatus(targetStatus);
        review.setReviewedAt(LocalDateTime.now());
        if (comments != null) {
            review.setComments(comments);
        }

        review = reviewRepository.save(review);
        auditService.logStatusChange("DesignReview", review.getId(),
                DesignReviewStatus.PENDING.name(), targetStatus.name());

        log.info("Рецензия {} завершена: {}", review.getId(), targetStatus);
        return DesignReviewResponse.fromEntity(review);
    }

    // ========================================================================
    // Design Sections
    // ========================================================================

    @Transactional(readOnly = true)
    public List<DesignSectionResponse> getSectionsForProject(UUID projectId) {
        return sectionRepository.findByProjectIdAndDeletedFalseOrderBySequenceAsc(projectId)
                .stream()
                .map(DesignSectionResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DesignSectionResponse> getRootSectionsForProject(UUID projectId) {
        return sectionRepository.findByProjectIdAndParentIdIsNullAndDeletedFalseOrderBySequenceAsc(projectId)
                .stream()
                .map(DesignSectionResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DesignSectionResponse> getChildSections(UUID parentId) {
        return sectionRepository.findByParentIdAndDeletedFalseOrderBySequenceAsc(parentId)
                .stream()
                .map(DesignSectionResponse::fromEntity)
                .toList();
    }

    @Transactional
    public DesignSectionResponse createSection(CreateDesignSectionRequest request) {
        DesignSection section = DesignSection.builder()
                .projectId(request.projectId())
                .name(request.name())
                .code(request.code())
                .discipline(request.discipline())
                .parentId(request.parentId())
                .sequence(request.sequence() != null ? request.sequence() : 0)
                .description(request.description())
                .build();

        section = sectionRepository.save(section);
        auditService.logCreate("DesignSection", section.getId());

        log.info("Раздел проекта создан: {} ({}) ({})", section.getName(), section.getCode(), section.getId());
        return DesignSectionResponse.fromEntity(section);
    }

    @Transactional
    public DesignSectionResponse updateSection(UUID id, CreateDesignSectionRequest request) {
        DesignSection section = sectionRepository.findById(id)
                .filter(s -> !s.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Раздел не найден: " + id));

        if (request.name() != null) section.setName(request.name());
        if (request.code() != null) section.setCode(request.code());
        if (request.discipline() != null) section.setDiscipline(request.discipline());
        if (request.parentId() != null) section.setParentId(request.parentId());
        if (request.sequence() != null) section.setSequence(request.sequence());
        if (request.description() != null) section.setDescription(request.description());

        section = sectionRepository.save(section);
        auditService.logUpdate("DesignSection", section.getId(), "multiple", null, null);

        log.info("Раздел проекта обновлён: {} ({}) ({})", section.getName(), section.getCode(), section.getId());
        return DesignSectionResponse.fromEntity(section);
    }

    @Transactional
    public void deleteSection(UUID id) {
        DesignSection section = sectionRepository.findById(id)
                .filter(s -> !s.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Раздел не найден: " + id));
        section.softDelete();
        sectionRepository.save(section);
        auditService.logDelete("DesignSection", id);
        log.info("Раздел проекта удалён: {}", id);
    }

    // ========================================================================
    // Private helpers
    // ========================================================================

    private DesignVersion getVersionOrThrow(UUID id) {
        return versionRepository.findById(id)
                .filter(v -> !v.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Версия проектной документации не найдена: " + id));
    }

    private DesignReview getReviewOrThrow(UUID id) {
        return reviewRepository.findById(id)
                .filter(r -> !r.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Рецензия не найдена: " + id));
    }
}
