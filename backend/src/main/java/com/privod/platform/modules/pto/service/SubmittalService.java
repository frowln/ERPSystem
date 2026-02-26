package com.privod.platform.modules.pto.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.pto.domain.Submittal;
import com.privod.platform.modules.pto.domain.SubmittalComment;
import com.privod.platform.modules.pto.domain.SubmittalStatus;
import com.privod.platform.modules.pto.repository.SubmittalCommentRepository;
import com.privod.platform.modules.pto.repository.SubmittalRepository;
import com.privod.platform.modules.pto.web.dto.ChangeSubmittalStatusRequest;
import com.privod.platform.modules.pto.web.dto.CreateSubmittalCommentRequest;
import com.privod.platform.modules.pto.web.dto.CreateSubmittalRequest;
import com.privod.platform.modules.pto.web.dto.SubmittalCommentResponse;
import com.privod.platform.modules.pto.web.dto.SubmittalResponse;
import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubmittalService {

    private final SubmittalRepository submittalRepository;
    private final SubmittalCommentRepository commentRepository;
    private final PtoCodeGenerator codeGenerator;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<SubmittalResponse> listSubmittals(UUID projectId, SubmittalStatus status, Pageable pageable) {
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
        return submittalRepository.findAll(spec, pageable).map(SubmittalResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public SubmittalResponse getSubmittal(UUID id) {
        Submittal submittal = getSubmittalOrThrow(id);
        return SubmittalResponse.fromEntity(submittal);
    }

    @Transactional
    public SubmittalResponse createSubmittal(CreateSubmittalRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        String code = codeGenerator.generateSubmittalCode();

        Submittal submittal = Submittal.builder()
                .projectId(request.projectId())
                .organizationId(organizationId)
                .code(code)
                .title(request.title())
                .submittalType(request.submittalType())
                .description(request.description())
                .status(SubmittalStatus.DRAFT)
                .submittedById(request.submittedById())
                .dueDate(request.dueDate())
                .build();

        submittal = submittalRepository.save(submittal);
        auditService.logCreate("Submittal", submittal.getId());

        log.info("Submittal created: {} ({}) for project {}", submittal.getTitle(), submittal.getCode(), request.projectId());
        return SubmittalResponse.fromEntity(submittal);
    }

    @Transactional
    public SubmittalResponse changeStatus(UUID id, ChangeSubmittalStatusRequest request) {
        Submittal submittal = getSubmittalOrThrow(id);
        SubmittalStatus oldStatus = submittal.getStatus();
        SubmittalStatus newStatus = request.status();

        if (!submittal.canTransitionTo(newStatus)) {
            throw new IllegalStateException(
                    String.format("Невозможно перевести передачу из статуса %s в %s",
                            oldStatus.getDisplayName(), newStatus.getDisplayName()));
        }

        submittal.setStatus(newStatus);

        if (newStatus == SubmittalStatus.APPROVED || newStatus == SubmittalStatus.REJECTED) {
            submittal.setResponseDate(LocalDate.now());
        }

        submittal = submittalRepository.save(submittal);
        auditService.logStatusChange("Submittal", submittal.getId(), oldStatus.name(), newStatus.name());

        log.info("Submittal status changed: {} from {} to {} ({})",
                submittal.getTitle(), oldStatus, newStatus, submittal.getId());
        return SubmittalResponse.fromEntity(submittal);
    }

    @Transactional
    public SubmittalCommentResponse addComment(UUID submittalId, CreateSubmittalCommentRequest request) {
        getSubmittalOrThrow(submittalId);

        SubmittalComment comment = SubmittalComment.builder()
                .submittalId(submittalId)
                .authorId(request.authorId())
                .content(request.content())
                .attachmentUrl(request.attachmentUrl())
                .build();

        comment = commentRepository.save(comment);
        auditService.logCreate("SubmittalComment", comment.getId());

        log.info("Comment added to submittal {}: ({})", submittalId, comment.getId());
        return SubmittalCommentResponse.fromEntity(comment);
    }

    @Transactional(readOnly = true)
    public List<SubmittalCommentResponse> getComments(UUID submittalId) {
        getSubmittalOrThrow(submittalId);
        return commentRepository.findBySubmittalIdAndDeletedFalseOrderByCreatedAtDesc(submittalId)
                .stream()
                .map(SubmittalCommentResponse::fromEntity)
                .toList();
    }

    @Transactional
    public void deleteSubmittal(UUID id) {
        Submittal submittal = getSubmittalOrThrow(id);
        submittal.softDelete();
        submittalRepository.save(submittal);
        auditService.logDelete("Submittal", id);
        log.info("Submittal deleted: {} ({})", submittal.getTitle(), id);
    }

    private Submittal getSubmittalOrThrow(UUID id) {
        return submittalRepository.findById(id)
                .filter(s -> !s.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Передача документации не найдена: " + id));
    }
}
