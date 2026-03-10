package com.privod.platform.modules.constructability.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.constructability.domain.*;
import com.privod.platform.modules.constructability.repository.ConstructabilityItemRepository;
import com.privod.platform.modules.constructability.repository.ConstructabilityReviewRepository;
import com.privod.platform.modules.constructability.web.dto.*;
import com.privod.platform.modules.project.repository.ProjectRepository;
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
public class ConstructabilityService {

    private final ConstructabilityReviewRepository reviewRepository;
    private final ConstructabilityItemRepository itemRepository;
    private final ProjectRepository projectRepository;
    private final AuditService auditService;

    // ===================== REVIEWS =====================

    @Transactional(readOnly = true)
    public Page<ConstructabilityReviewResponse> listByProject(UUID projectId, Pageable pageable) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        Page<ConstructabilityReview> page = projectId != null
                ? reviewRepository.findByProjectIdAndOrganizationIdAndDeletedFalse(projectId, orgId, pageable)
                : reviewRepository.findByOrganizationIdAndDeletedFalse(orgId, pageable);
        return page.map(r -> ConstructabilityReviewResponse.fromEntity(r, itemRepository.countByReviewIdAndDeletedFalse(r.getId())));
    }

    @Transactional(readOnly = true)
    public ConstructabilityReviewResponse getById(UUID id) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        ConstructabilityReview review = reviewRepository.findByIdAndOrganizationIdAndDeletedFalse(id, orgId)
                .orElseThrow(() -> new EntityNotFoundException("Обзор конструктивности не найден: " + id));
        long count = itemRepository.countByReviewIdAndDeletedFalse(id);
        return ConstructabilityReviewResponse.fromEntity(review, count);
    }

    @Transactional
    public ConstructabilityReviewResponse create(CreateConstructabilityReviewRequest req) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        projectRepository.findById(req.projectId())
                .filter(p -> !p.isDeleted())
                .filter(p -> orgId.equals(p.getOrganizationId()))
                .orElseThrow(() -> new EntityNotFoundException("Проект не найден: " + req.projectId()));

        ConstructabilityReview review = ConstructabilityReview.builder()
                .projectId(req.projectId())
                .organizationId(orgId)
                .specificationId(req.specificationId())
                .title(req.title())
                .reviewerName(req.reviewerName())
                .reviewDate(req.reviewDate())
                .overallRating(req.overallRating() != null ? OverallRating.valueOf(req.overallRating()) : null)
                .notes(req.notes())
                .status(ReviewStatus.DRAFT)
                .build();

        review = reviewRepository.save(review);
        auditService.logCreate("ConstructabilityReview", review.getId());
        log.info("Constructability review created: {} for project {}", review.getId(), req.projectId());
        return ConstructabilityReviewResponse.fromEntity(review, 0);
    }

    @Transactional
    public ConstructabilityReviewResponse update(UUID id, UpdateConstructabilityReviewRequest req) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        ConstructabilityReview review = reviewRepository.findByIdAndOrganizationIdAndDeletedFalse(id, orgId)
                .orElseThrow(() -> new EntityNotFoundException("Обзор конструктивности не найден: " + id));

        if (req.title() != null) review.setTitle(req.title());
        if (req.reviewerName() != null) review.setReviewerName(req.reviewerName());
        if (req.reviewDate() != null) review.setReviewDate(req.reviewDate());
        if (req.specificationId() != null) review.setSpecificationId(req.specificationId());
        if (req.overallRating() != null) review.setOverallRating(OverallRating.valueOf(req.overallRating()));
        if (req.status() != null) review.setStatus(ReviewStatus.valueOf(req.status()));
        if (req.notes() != null) review.setNotes(req.notes());

        review = reviewRepository.save(review);
        auditService.logUpdate("ConstructabilityReview", review.getId(), "status", null, review.getStatus().name());
        log.info("Constructability review updated: {}", review.getId());
        long count = itemRepository.countByReviewIdAndDeletedFalse(id);
        return ConstructabilityReviewResponse.fromEntity(review, count);
    }

    @Transactional
    public void deleteReview(UUID id) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        ConstructabilityReview review = reviewRepository.findByIdAndOrganizationIdAndDeletedFalse(id, orgId)
                .orElseThrow(() -> new EntityNotFoundException("Обзор конструктивности не найден: " + id));
        review.softDelete();
        reviewRepository.save(review);
        auditService.logDelete("ConstructabilityReview", id);
        log.info("Constructability review soft-deleted: {}", id);
    }

    // ===================== ITEMS =====================

    @Transactional(readOnly = true)
    public List<ConstructabilityItemResponse> listItems(UUID reviewId) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        // Verify review belongs to org
        reviewRepository.findByIdAndOrganizationIdAndDeletedFalse(reviewId, orgId)
                .orElseThrow(() -> new EntityNotFoundException("Обзор конструктивности не найден: " + reviewId));
        return itemRepository.findByReviewIdAndDeletedFalseOrderByCreatedAtDesc(reviewId)
                .stream().map(ConstructabilityItemResponse::fromEntity).toList();
    }

    @Transactional
    public ConstructabilityItemResponse addItem(UUID reviewId, CreateConstructabilityItemRequest req) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        reviewRepository.findByIdAndOrganizationIdAndDeletedFalse(reviewId, orgId)
                .orElseThrow(() -> new EntityNotFoundException("Обзор конструктивности не найден: " + reviewId));

        ConstructabilityItem item = ConstructabilityItem.builder()
                .reviewId(reviewId)
                .category(ItemCategory.valueOf(req.category()))
                .description(req.description())
                .severity(req.severity() != null ? ItemSeverity.valueOf(req.severity()) : ItemSeverity.MEDIUM)
                .status(req.status() != null ? ItemStatus.valueOf(req.status()) : ItemStatus.OPEN)
                .resolution(req.resolution())
                .rfiId(req.rfiId())
                .assignedTo(req.assignedTo())
                .build();

        item = itemRepository.save(item);
        auditService.logCreate("ConstructabilityItem", item.getId());
        log.info("Constructability item added: {} to review {}", item.getId(), reviewId);
        return ConstructabilityItemResponse.fromEntity(item);
    }

    @Transactional
    public ConstructabilityItemResponse updateItem(UUID reviewId, UUID itemId, UpdateConstructabilityItemRequest req) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        reviewRepository.findByIdAndOrganizationIdAndDeletedFalse(reviewId, orgId)
                .orElseThrow(() -> new EntityNotFoundException("Обзор конструктивности не найден: " + reviewId));

        ConstructabilityItem item = itemRepository.findByIdAndDeletedFalse(itemId)
                .orElseThrow(() -> new EntityNotFoundException("Элемент обзора не найден: " + itemId));

        if (req.category() != null) item.setCategory(ItemCategory.valueOf(req.category()));
        if (req.description() != null) item.setDescription(req.description());
        if (req.severity() != null) item.setSeverity(ItemSeverity.valueOf(req.severity()));
        if (req.status() != null) item.setStatus(ItemStatus.valueOf(req.status()));
        if (req.resolution() != null) item.setResolution(req.resolution());
        if (req.rfiId() != null) item.setRfiId(req.rfiId());
        if (req.assignedTo() != null) item.setAssignedTo(req.assignedTo());

        item = itemRepository.save(item);
        auditService.logUpdate("ConstructabilityItem", item.getId(), "status", null, item.getStatus().name());
        log.info("Constructability item updated: {}", item.getId());
        return ConstructabilityItemResponse.fromEntity(item);
    }

    @Transactional
    public void deleteItem(UUID reviewId, UUID itemId) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        reviewRepository.findByIdAndOrganizationIdAndDeletedFalse(reviewId, orgId)
                .orElseThrow(() -> new EntityNotFoundException("Обзор конструктивности не найден: " + reviewId));

        ConstructabilityItem item = itemRepository.findByIdAndDeletedFalse(itemId)
                .orElseThrow(() -> new EntityNotFoundException("Элемент обзора не найден: " + itemId));
        item.softDelete();
        itemRepository.save(item);
        auditService.logDelete("ConstructabilityItem", itemId);
        log.info("Constructability item soft-deleted: {}", itemId);
    }
}
