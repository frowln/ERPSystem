package com.privod.platform.modules.pmWorkflow.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.pmWorkflow.domain.Issue;
import com.privod.platform.modules.pmWorkflow.domain.IssueComment;
import com.privod.platform.modules.pmWorkflow.domain.IssueStatus;
import com.privod.platform.modules.pmWorkflow.repository.IssueCommentRepository;
import com.privod.platform.modules.pmWorkflow.repository.IssueRepository;
import com.privod.platform.modules.pmWorkflow.web.dto.ChangeIssueStatusRequest;
import com.privod.platform.modules.pmWorkflow.web.dto.CreateIssueCommentRequest;
import com.privod.platform.modules.pmWorkflow.web.dto.CreateIssueRequest;
import com.privod.platform.modules.pmWorkflow.web.dto.IssueCommentResponseDto;
import com.privod.platform.modules.pmWorkflow.web.dto.IssueResponseDto;
import com.privod.platform.modules.pmWorkflow.web.dto.UpdateIssueRequest;
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
public class IssueService {

    private final IssueRepository issueRepository;
    private final IssueCommentRepository commentRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<IssueResponseDto> listIssues(UUID projectId, IssueStatus status, Pageable pageable) {
        Specification<Issue> spec = (root, query, cb) -> {
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
        return issueRepository.findAll(spec, pageable).map(IssueResponseDto::fromEntity);
    }

    @Transactional(readOnly = true)
    public IssueResponseDto getIssue(UUID id) {
        Issue issue = getIssueOrThrow(id);
        return IssueResponseDto.fromEntity(issue);
    }

    @Transactional
    public IssueResponseDto createIssue(CreateIssueRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        String number = generateIssueNumber(request.projectId());

        Issue issue = Issue.builder()
                .organizationId(organizationId)
                .projectId(request.projectId())
                .number(number)
                .title(request.title())
                .description(request.description())
                .issueType(request.issueType())
                .status(IssueStatus.OPEN)
                .priority(request.priority() != null ? request.priority() : com.privod.platform.modules.pmWorkflow.domain.IssuePriority.NORMAL)
                .assignedToId(request.assignedToId())
                .reportedById(request.reportedById())
                .dueDate(request.dueDate())
                .location(request.location())
                .linkedRfiId(request.linkedRfiId())
                .linkedSubmittalId(request.linkedSubmittalId())
                .linkedDocumentIds(request.linkedDocumentIds())
                .tags(request.tags())
                .build();

        issue = issueRepository.save(issue);
        auditService.logCreate("Issue", issue.getId());

        log.info("Проблема создана: {} ({}) для проекта {}", issue.getTitle(), issue.getNumber(), request.projectId());
        return IssueResponseDto.fromEntity(issue);
    }

    @Transactional
    public IssueResponseDto updateIssue(UUID id, UpdateIssueRequest request) {
        Issue issue = getIssueOrThrow(id);

        if (request.title() != null) {
            issue.setTitle(request.title());
        }
        if (request.description() != null) {
            issue.setDescription(request.description());
        }
        if (request.issueType() != null) {
            issue.setIssueType(request.issueType());
        }
        if (request.priority() != null) {
            issue.setPriority(request.priority());
        }
        if (request.assignedToId() != null) {
            issue.setAssignedToId(request.assignedToId());
        }
        if (request.dueDate() != null) {
            issue.setDueDate(request.dueDate());
        }
        if (request.location() != null) {
            issue.setLocation(request.location());
        }
        if (request.linkedRfiId() != null) {
            issue.setLinkedRfiId(request.linkedRfiId());
        }
        if (request.linkedSubmittalId() != null) {
            issue.setLinkedSubmittalId(request.linkedSubmittalId());
        }
        if (request.linkedDocumentIds() != null) {
            issue.setLinkedDocumentIds(request.linkedDocumentIds());
        }
        if (request.rootCause() != null) {
            issue.setRootCause(request.rootCause());
        }
        if (request.resolution() != null) {
            issue.setResolution(request.resolution());
        }
        if (request.tags() != null) {
            issue.setTags(request.tags());
        }

        issue = issueRepository.save(issue);
        auditService.logUpdate("Issue", issue.getId(), "multiple", null, null);

        log.info("Проблема обновлена: {} ({})", issue.getTitle(), issue.getId());
        return IssueResponseDto.fromEntity(issue);
    }

    @Transactional
    public IssueResponseDto changeStatus(UUID id, ChangeIssueStatusRequest request) {
        Issue issue = getIssueOrThrow(id);
        IssueStatus oldStatus = issue.getStatus();
        IssueStatus newStatus = request.status();

        if (!issue.canTransitionTo(newStatus)) {
            throw new IllegalStateException(
                    String.format("Невозможно перевести проблему из статуса '%s' в '%s'",
                            oldStatus.getDisplayName(), newStatus.getDisplayName()));
        }

        issue.setStatus(newStatus);

        if (newStatus == IssueStatus.RESOLVED) {
            issue.setResolvedDate(LocalDate.now());
            if (request.resolvedById() != null) {
                issue.setResolvedById(request.resolvedById());
            }
        }

        issue = issueRepository.save(issue);
        auditService.logStatusChange("Issue", issue.getId(), oldStatus.name(), newStatus.name());

        log.info("Проблема статус изменён: {} с {} на {} ({})",
                issue.getTitle(), oldStatus, newStatus, issue.getId());
        return IssueResponseDto.fromEntity(issue);
    }

    @Transactional
    public void deleteIssue(UUID id) {
        Issue issue = getIssueOrThrow(id);
        issue.softDelete();
        issueRepository.save(issue);
        auditService.logDelete("Issue", id);
        log.info("Проблема удалена: {} ({})", issue.getTitle(), id);
    }

    // ======================== Issue Comments ========================

    @Transactional(readOnly = true)
    public Page<IssueCommentResponseDto> listComments(UUID issueId, Pageable pageable) {
        return commentRepository.findByIssueIdAndDeletedFalse(issueId, pageable)
                .map(IssueCommentResponseDto::fromEntity);
    }

    @Transactional
    public IssueCommentResponseDto addComment(CreateIssueCommentRequest request) {
        getIssueOrThrow(request.issueId());

        IssueComment comment = IssueComment.builder()
                .issueId(request.issueId())
                .authorId(request.authorId())
                .commentText(request.commentText())
                .attachmentIds(request.attachmentIds())
                .postedAt(Instant.now())
                .build();

        comment = commentRepository.save(comment);
        auditService.logCreate("IssueComment", comment.getId());

        log.info("Комментарий к проблеме добавлен: issue={}, author={}", request.issueId(), request.authorId());
        return IssueCommentResponseDto.fromEntity(comment);
    }

    @Transactional(readOnly = true)
    public List<IssueResponseDto> findOverdueIssues(UUID projectId) {
        List<Issue> overdue;
        if (projectId != null) {
            overdue = issueRepository.findOverdueIssuesByProject(projectId, LocalDate.now());
        } else {
            overdue = issueRepository.findOverdueIssues(LocalDate.now());
        }
        return overdue.stream().map(IssueResponseDto::fromEntity).toList();
    }

    private Issue getIssueOrThrow(UUID id) {
        return issueRepository.findById(id)
                .filter(i -> !i.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Проблема не найдена: " + id));
    }

    private String generateIssueNumber(UUID projectId) {
        String prefix = "ISS-";
        Integer maxNum = issueRepository.findMaxNumberByProject(projectId, prefix);
        int next = (maxNum != null ? maxNum : 0) + 1;
        return prefix + String.format("%05d", next);
    }
}
