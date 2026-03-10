package com.privod.platform.modules.pmWorkflow.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.pto.domain.Submittal;
import com.privod.platform.modules.pto.service.PtoCodeGenerator;
import com.privod.platform.modules.pmWorkflow.domain.SubmittalPackage;
import com.privod.platform.modules.pmWorkflow.domain.SubmittalReview;
import com.privod.platform.modules.pto.domain.SubmittalStatus;
import com.privod.platform.modules.pmWorkflow.repository.SubmittalPackageRepository;
import com.privod.platform.modules.pmWorkflow.repository.PmSubmittalRepository;
import com.privod.platform.modules.pmWorkflow.repository.SubmittalReviewRepository;
import com.privod.platform.modules.pmWorkflow.web.dto.ChangeSubmittalStatusRequest;
import com.privod.platform.modules.pmWorkflow.web.dto.CreateSubmittalPackageRequest;
import com.privod.platform.modules.pmWorkflow.web.dto.CreateSubmittalRequest;
import com.privod.platform.modules.pmWorkflow.web.dto.CreateSubmittalReviewRequest;
import com.privod.platform.modules.pmWorkflow.web.dto.SubmittalPackageResponseDto;
import com.privod.platform.modules.pmWorkflow.web.dto.SubmittalResponseDto;
import com.privod.platform.modules.pmWorkflow.web.dto.SubmittalReviewResponseDto;
import com.privod.platform.modules.pmWorkflow.web.dto.UpdateSubmittalRequest;
import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PmSubmittalService {

    private final PmSubmittalRepository submittalRepository;
    private final SubmittalPackageRepository packageRepository;
    private final SubmittalReviewRepository reviewRepository;
    private final AuditService auditService;
    private final PtoCodeGenerator codeGenerator;

    // ======================== Submittal CRUD ========================

    @Transactional(readOnly = true)
    public Page<SubmittalResponseDto> listSubmittals(UUID projectId, SubmittalStatus status, Pageable pageable) {
        Specification<Submittal> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("deleted"), false));
            if (projectId != null) {
                predicates.add(cb.equal(root.get("projectId"), projectId));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        return submittalRepository.findAll(spec, pageable).map(SubmittalResponseDto::fromEntity);
    }

    @Transactional(readOnly = true)
    public SubmittalResponseDto getSubmittal(UUID id) {
        Submittal submittal = getSubmittalOrThrow(id);
        return SubmittalResponseDto.fromEntity(submittal);
    }

    @Transactional
    public SubmittalResponseDto createSubmittal(CreateSubmittalRequest request) {
        String number = generateSubmittalNumber(request.projectId());
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();

        Submittal submittal = Submittal.builder()
                .projectId(request.projectId())
                .organizationId(organizationId)
                .code(number)
                .title(request.title())
                .description(request.description())
                .submittalType(request.submittalType())
                .status(SubmittalStatus.DRAFT)
                .specSection(request.specSection())
                .dueDate(request.dueDate())
                .submittedById(request.submittedById())
                .ballInCourt(request.ballInCourt())
                .leadTime(request.leadTime())
                .requiredDate(request.requiredDate())
                .linkedDrawingIds(request.linkedDrawingIds())
                .attachmentIds(request.attachmentIds())
                .tags(request.tags())
                .build();

        submittal = submittalRepository.save(submittal);
        auditService.logCreate("Submittal", submittal.getId());

        log.info("Сабмитал создан: {} ({}) для проекта {}", submittal.getTitle(), submittal.getCode(), request.projectId());
        return SubmittalResponseDto.fromEntity(submittal);
    }

    @Transactional
    public SubmittalResponseDto updateSubmittal(UUID id, UpdateSubmittalRequest request) {
        Submittal submittal = getSubmittalOrThrow(id);

        if (request.title() != null) {
            submittal.setTitle(request.title());
        }
        if (request.description() != null) {
            submittal.setDescription(request.description());
        }
        if (request.submittalType() != null) {
            submittal.setSubmittalType(request.submittalType());
        }
        if (request.specSection() != null) {
            submittal.setSpecSection(request.specSection());
        }
        if (request.dueDate() != null) {
            submittal.setDueDate(request.dueDate());
        }
        if (request.ballInCourt() != null) {
            submittal.setBallInCourt(request.ballInCourt());
        }
        if (request.leadTime() != null) {
            submittal.setLeadTime(request.leadTime());
        }
        if (request.requiredDate() != null) {
            submittal.setRequiredDate(request.requiredDate());
        }
        if (request.linkedDrawingIds() != null) {
            submittal.setLinkedDrawingIds(request.linkedDrawingIds());
        }
        if (request.attachmentIds() != null) {
            submittal.setAttachmentIds(request.attachmentIds());
        }
        if (request.tags() != null) {
            submittal.setTags(request.tags());
        }

        submittal = submittalRepository.save(submittal);
        auditService.logUpdate("Submittal", submittal.getId(), "multiple", null, null);

        log.info("Сабмитал обновлён: {} ({})", submittal.getTitle(), submittal.getId());
        return SubmittalResponseDto.fromEntity(submittal);
    }

    @Transactional
    public SubmittalResponseDto changeStatus(UUID id, ChangeSubmittalStatusRequest request) {
        Submittal submittal = getSubmittalOrThrow(id);
        SubmittalStatus oldStatus = submittal.getStatus();
        SubmittalStatus newStatus = request.status();

        if (!submittal.canTransitionTo(newStatus)) {
            throw new IllegalStateException(
                    String.format("Невозможно перевести сабмитал из статуса '%s' в '%s'",
                            oldStatus.getDisplayName(), newStatus.getDisplayName()));
        }

        submittal.setStatus(newStatus);

        if (newStatus == SubmittalStatus.SUBMITTED) {
            submittal.setSubmittedDate(LocalDate.now());
        }

        if (request.ballInCourt() != null) {
            submittal.setBallInCourt(request.ballInCourt());
        }

        submittal = submittalRepository.save(submittal);
        auditService.logStatusChange("Submittal", submittal.getId(), oldStatus.name(), newStatus.name());

        log.info("Сабмитал статус изменён: {} с {} на {} ({})",
                submittal.getTitle(), oldStatus, newStatus, submittal.getId());
        return SubmittalResponseDto.fromEntity(submittal);
    }

    @Transactional
    public void deleteSubmittal(UUID id) {
        Submittal submittal = getSubmittalOrThrow(id);
        submittal.softDelete();
        submittalRepository.save(submittal);
        auditService.logDelete("Submittal", id);
        log.info("Сабмитал удалён: {} ({})", submittal.getTitle(), id);
    }

    @Transactional(readOnly = true)
    public List<SubmittalResponseDto> findByBallInCourt(UUID userId) {
        return submittalRepository.findByBallInCourt(userId).stream()
                .map(SubmittalResponseDto::fromEntity).toList();
    }

    @Transactional(readOnly = true)
    public List<SubmittalResponseDto> findOverdueSubmittals(UUID projectId) {
        List<Submittal> overdue;
        if (projectId != null) {
            overdue = submittalRepository.findOverdueSubmittalsByProject(projectId, LocalDate.now());
        } else {
            overdue = submittalRepository.findOverdueSubmittals(LocalDate.now());
        }
        return overdue.stream().map(SubmittalResponseDto::fromEntity).toList();
    }

    // ======================== Submittal Packages ========================

    @Transactional(readOnly = true)
    public Page<SubmittalPackageResponseDto> listPackages(UUID projectId, Pageable pageable) {
        return packageRepository.findByProjectIdAndDeletedFalse(projectId, pageable)
                .map(SubmittalPackageResponseDto::fromEntity);
    }

    @Transactional
    public SubmittalPackageResponseDto createPackage(CreateSubmittalPackageRequest request) {
        String packageNumber = "PKG-" + String.format("%05d", packageRepository.countByProjectIdAndDeletedFalse(request.projectId()) + 1);

        SubmittalPackage pkg = SubmittalPackage.builder()
                .projectId(request.projectId())
                .packageNumber(packageNumber)
                .title(request.title())
                .description(request.description())
                .submittalIds(request.submittalIds())
                .build();

        pkg = packageRepository.save(pkg);
        auditService.logCreate("SubmittalPackage", pkg.getId());

        log.info("Пакет сабмиталов создан: {} ({}) для проекта {}", pkg.getTitle(), pkg.getPackageNumber(), request.projectId());
        return SubmittalPackageResponseDto.fromEntity(pkg);
    }

    @Transactional
    public void deletePackage(UUID id) {
        SubmittalPackage pkg = packageRepository.findById(id)
                .filter(p -> !p.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Пакет сабмиталов не найден: " + id));
        pkg.softDelete();
        packageRepository.save(pkg);
        auditService.logDelete("SubmittalPackage", id);
        log.info("Пакет сабмиталов удалён: {} ({})", pkg.getTitle(), id);
    }

    // ======================== Submittal Reviews ========================

    @Transactional(readOnly = true)
    public Page<SubmittalReviewResponseDto> listReviews(UUID submittalId, Pageable pageable) {
        return reviewRepository.findBySubmittalIdAndDeletedFalse(submittalId, pageable)
                .map(SubmittalReviewResponseDto::fromEntity);
    }

    @Transactional
    public SubmittalReviewResponseDto addReview(CreateSubmittalReviewRequest request) {
        getSubmittalOrThrow(request.submittalId());

        SubmittalReview review = SubmittalReview.builder()
                .submittalId(request.submittalId())
                .reviewerId(request.reviewerId())
                .status(request.status())
                .comments(request.comments())
                .stampType(request.stampType())
                .attachmentIds(request.attachmentIds())
                .reviewedAt(Instant.now())
                .build();

        review = reviewRepository.save(review);
        auditService.logCreate("SubmittalReview", review.getId());

        log.info("Рецензия на сабмитал добавлена: submittal={}, reviewer={}", request.submittalId(), request.reviewerId());
        return SubmittalReviewResponseDto.fromEntity(review);
    }

    private Submittal getSubmittalOrThrow(UUID id) {
        return submittalRepository.findById(id)
                .filter(s -> !s.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Сабмитал не найден: " + id));
    }

    private String generateSubmittalNumber(UUID projectId) {
        return codeGenerator.generateSubmittalCode();
    }
}
