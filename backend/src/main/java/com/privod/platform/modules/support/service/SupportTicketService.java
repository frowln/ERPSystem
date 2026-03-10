package com.privod.platform.modules.support.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.auth.domain.User;
import com.privod.platform.modules.auth.repository.UserRepository;
import com.privod.platform.modules.support.domain.SupportTicket;
import com.privod.platform.modules.support.domain.TicketComment;
import com.privod.platform.modules.support.domain.TicketPriority;
import com.privod.platform.modules.support.domain.TicketStatus;
import com.privod.platform.modules.support.repository.SupportTicketRepository;
import com.privod.platform.modules.support.repository.TicketCommentRepository;
import com.privod.platform.modules.support.web.dto.CreateSupportTicketRequest;
import com.privod.platform.modules.support.web.dto.CreateTicketCommentRequest;
import com.privod.platform.modules.support.web.dto.SupportTicketResponse;
import com.privod.platform.modules.support.web.dto.TicketCommentResponse;
import com.privod.platform.modules.support.web.dto.TicketDashboardResponse;
import com.privod.platform.modules.support.web.dto.UpdateSupportTicketRequest;
import com.privod.platform.modules.notification.domain.NotificationType;
import com.privod.platform.modules.notification.service.NotificationService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SupportTicketService {

    private final SupportTicketRepository ticketRepository;
    private final TicketCommentRepository commentRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public Page<SupportTicketResponse> listTickets(TicketStatus status, Pageable pageable) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        if (status != null) {
            return ticketRepository.findByOrganizationIdAndStatusAndDeletedFalse(organizationId, status, pageable)
                    .map(SupportTicketResponse::fromEntity);
        }
        return ticketRepository.findByOrganizationIdAndDeletedFalse(organizationId, pageable)
                .map(SupportTicketResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public SupportTicketResponse getTicket(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        SupportTicket ticket = getTicketOrThrow(id, organizationId);
        return SupportTicketResponse.fromEntity(ticket);
    }

    @Transactional
    public SupportTicketResponse createTicket(CreateSupportTicketRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        UUID currentUserId = SecurityUtils.requireCurrentUserId();
        UUID reporterId = currentUserId;
        validateUserTenant(reporterId, organizationId);

        String code = generateTicketCode();

        SupportTicket ticket = SupportTicket.builder()
                .organizationId(organizationId)
                .code(code)
                .subject(request.subject())
                .description(request.description())
                .category(request.category())
                .priority(request.priority() != null ? request.priority() : TicketPriority.MEDIUM)
                .status(TicketStatus.OPEN)
                .reporterId(reporterId)
                .dueDate(request.dueDate())
                .build();

        ticket = ticketRepository.save(ticket);
        auditService.logCreate("SupportTicket", ticket.getId());

        log.info("Support ticket created: {} - {} ({})", ticket.getCode(),
                ticket.getSubject(), ticket.getId());
        return SupportTicketResponse.fromEntity(ticket);
    }

    @Transactional
    public SupportTicketResponse updateTicket(UUID id, UpdateSupportTicketRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        SupportTicket ticket = getTicketOrThrow(id, organizationId);

        if (request.subject() != null) {
            ticket.setSubject(request.subject());
        }
        if (request.description() != null) {
            ticket.setDescription(request.description());
        }
        if (request.category() != null) {
            ticket.setCategory(request.category());
        }
        if (request.priority() != null) {
            ticket.setPriority(request.priority());
        }
        if (request.status() != null) {
            ticket.setStatus(request.status());
        }
        if (request.assigneeId() != null) {
            validateUserTenant(request.assigneeId(), organizationId);
            ticket.setAssigneeId(request.assigneeId());
        }
        if (request.dueDate() != null) {
            ticket.setDueDate(request.dueDate());
        }
        if (request.satisfactionRating() != null) {
            ticket.setSatisfactionRating(request.satisfactionRating());
        }

        ticket = ticketRepository.save(ticket);
        auditService.logUpdate("SupportTicket", ticket.getId(), "multiple", null, null);

        log.info("Support ticket updated: {} ({})", ticket.getCode(), ticket.getId());
        return SupportTicketResponse.fromEntity(ticket);
    }

    @Transactional
    public SupportTicketResponse assignTicket(UUID id, UUID assigneeId) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        SupportTicket ticket = getTicketOrThrow(id, organizationId);
        validateUserTenant(assigneeId, organizationId);

        TicketStatus oldStatus = ticket.getStatus();
        ticket.setAssigneeId(assigneeId);
        ticket.setStatus(TicketStatus.ASSIGNED);

        ticket = ticketRepository.save(ticket);
        auditService.logStatusChange("SupportTicket", ticket.getId(),
                oldStatus.name(), TicketStatus.ASSIGNED.name());

        log.info("Support ticket assigned: {} to {} ({})", ticket.getCode(), assigneeId, ticket.getId());
        return SupportTicketResponse.fromEntity(ticket);
    }

    @Transactional
    public SupportTicketResponse startProgress(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        SupportTicket ticket = getTicketOrThrow(id, organizationId);

        if (ticket.getStatus() != TicketStatus.ASSIGNED && ticket.getStatus() != TicketStatus.OPEN) {
            throw new IllegalStateException(
                    String.format("Начать работу можно только из статуса Открыта/Назначена, текущий: %s",
                            ticket.getStatus().getDisplayName()));
        }

        TicketStatus oldStatus = ticket.getStatus();
        ticket.setStatus(TicketStatus.IN_PROGRESS);

        ticket = ticketRepository.save(ticket);
        auditService.logStatusChange("SupportTicket", ticket.getId(),
                oldStatus.name(), TicketStatus.IN_PROGRESS.name());

        log.info("Support ticket in progress: {} ({})", ticket.getCode(), ticket.getId());
        return SupportTicketResponse.fromEntity(ticket);
    }

    @Transactional
    public SupportTicketResponse resolveTicket(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        SupportTicket ticket = getTicketOrThrow(id, organizationId);

        if (ticket.getStatus() == TicketStatus.RESOLVED || ticket.getStatus() == TicketStatus.CLOSED) {
            throw new IllegalStateException(
                    String.format("Заявка уже решена или закрыта, текущий статус: %s",
                            ticket.getStatus().getDisplayName()));
        }

        TicketStatus oldStatus = ticket.getStatus();
        ticket.setStatus(TicketStatus.RESOLVED);
        ticket.setResolvedAt(Instant.now());

        ticket = ticketRepository.save(ticket);
        auditService.logStatusChange("SupportTicket", ticket.getId(),
                oldStatus.name(), TicketStatus.RESOLVED.name());

        // Notify the reporter that their ticket has been resolved
        if (ticket.getReporterId() != null) {
            try {
                notificationService.send(
                        ticket.getReporterId(),
                        "Заявка решена: " + ticket.getCode(),
                        "Ваша заявка «" + ticket.getSubject() + "» была решена",
                        NotificationType.SUCCESS,
                        "SupportTicket",
                        ticket.getId(),
                        "/support/tickets/" + ticket.getId()
                );
            } catch (Exception e) {
                log.warn("Failed to send resolve notification for ticket {}: {}", id, e.getMessage());
            }
        }

        log.info("Support ticket resolved: {} ({})", ticket.getCode(), ticket.getId());
        return SupportTicketResponse.fromEntity(ticket);
    }

    @Transactional
    public SupportTicketResponse closeTicket(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        SupportTicket ticket = getTicketOrThrow(id, organizationId);

        if (ticket.getStatus() != TicketStatus.RESOLVED) {
            throw new IllegalStateException(
                    String.format("Закрыть можно только решённую заявку, текущий статус: %s",
                            ticket.getStatus().getDisplayName()));
        }

        TicketStatus oldStatus = ticket.getStatus();
        ticket.setStatus(TicketStatus.CLOSED);

        ticket = ticketRepository.save(ticket);
        auditService.logStatusChange("SupportTicket", ticket.getId(),
                oldStatus.name(), TicketStatus.CLOSED.name());

        log.info("Support ticket closed: {} ({})", ticket.getCode(), ticket.getId());
        return SupportTicketResponse.fromEntity(ticket);
    }

    @Transactional
    public void deleteTicket(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        SupportTicket ticket = getTicketOrThrow(id, organizationId);
        ticket.softDelete();
        ticketRepository.save(ticket);
        auditService.logDelete("SupportTicket", id);
        log.info("Support ticket deleted: {} ({})", ticket.getCode(), id);
    }

    // ---- Comments ----

    @Transactional(readOnly = true)
    public List<TicketCommentResponse> getTicketComments(UUID ticketId) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        getTicketOrThrow(ticketId, organizationId);
        boolean canSeeInternal = SecurityUtils.hasRole("ADMIN") || SecurityUtils.hasRole("SUPPORT_MANAGER");
        return commentRepository.findByTicketIdAndDeletedFalseOrderByCreatedAtDesc(ticketId)
                .stream()
                .filter(c -> canSeeInternal || !c.isInternal())
                .map(TicketCommentResponse::fromEntity)
                .toList();
    }

    @Transactional
    public TicketCommentResponse addComment(UUID ticketId, CreateTicketCommentRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        UUID currentUserId = SecurityUtils.requireCurrentUserId();
        SupportTicket ticket = getTicketOrThrow(ticketId, organizationId);
        validateUserTenant(currentUserId, organizationId);

        TicketComment comment = TicketComment.builder()
                .ticketId(ticketId)
                .authorId(currentUserId)
                .content(request.content())
                .isInternal(request.isInternal())
                .attachmentUrls(request.attachmentUrls())
                .build();

        comment = commentRepository.save(comment);
        auditService.logCreate("TicketComment", comment.getId());

        // Send notification to the ticket reporter when a non-internal comment is added
        if (!request.isInternal() && ticket.getReporterId() != null
                && !currentUserId.equals(ticket.getReporterId())) {
            try {
                String authorName = userRepository.findById(currentUserId)
                        .map(User::getFullName)
                        .orElse("Техподдержка");
                notificationService.send(
                        ticket.getReporterId(),
                        "Ответ по заявке " + ticket.getCode(),
                        authorName + " ответил на вашу заявку «" + ticket.getSubject() + "»",
                        NotificationType.COMMENT_ADDED,
                        "SupportTicket",
                        ticket.getId(),
                        "/support/tickets/" + ticket.getId()
                );
            } catch (Exception e) {
                log.warn("Failed to send notification for ticket comment {}: {}", ticketId, e.getMessage());
            }
        }

        // Also notify assignee if comment is from the reporter
        if (!request.isInternal() && ticket.getAssigneeId() != null
                && !currentUserId.equals(ticket.getAssigneeId())) {
            try {
                String authorName = userRepository.findById(currentUserId)
                        .map(User::getFullName)
                        .orElse("Пользователь");
                notificationService.send(
                        ticket.getAssigneeId(),
                        "Новый комментарий: " + ticket.getCode(),
                        authorName + " оставил комментарий к заявке «" + ticket.getSubject() + "»",
                        NotificationType.COMMENT_ADDED,
                        "SupportTicket",
                        ticket.getId(),
                        "/support/tickets/" + ticket.getId()
                );
            } catch (Exception e) {
                log.warn("Failed to send notification for ticket comment {}: {}", ticketId, e.getMessage());
            }
        }

        log.info("Comment added to ticket {}: ({})", ticketId, comment.getId());
        return TicketCommentResponse.fromEntity(comment);
    }

    // ---- Dashboard ----

    @Transactional(readOnly = true)
    public TicketDashboardResponse getDashboard() {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        long totalTickets = ticketRepository.countTotalByOrganizationId(organizationId);
        long openTickets = ticketRepository.countOpenByOrganizationId(organizationId);

        Map<String, Long> statusCounts = new HashMap<>();
        for (Object[] row : ticketRepository.countByStatusAndOrganizationId(organizationId)) {
            TicketStatus status = (TicketStatus) row[0];
            Long count = (Long) row[1];
            statusCounts.put(status.name(), count);
        }

        Map<String, Long> priorityCounts = new HashMap<>();
        for (Object[] row : ticketRepository.countByPriorityAndOrganizationId(organizationId)) {
            TicketPriority priority = (TicketPriority) row[0];
            Long count = (Long) row[1];
            priorityCounts.put(priority.name(), count);
        }

        return new TicketDashboardResponse(totalTickets, openTickets, statusCounts, priorityCounts);
    }

    @Transactional(readOnly = true)
    public Page<SupportTicketResponse> getMyTickets(Pageable pageable) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        UUID currentUserId = SecurityUtils.requireCurrentUserId();
        return ticketRepository.findByOrganizationIdAndReporterIdAndDeletedFalse(organizationId, currentUserId, pageable)
                .map(SupportTicketResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public Page<SupportTicketResponse> getAssignedTickets(Pageable pageable) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        UUID currentUserId = SecurityUtils.requireCurrentUserId();
        return ticketRepository.findByOrganizationIdAndAssigneeIdAndDeletedFalse(organizationId, currentUserId, pageable)
                .map(SupportTicketResponse::fromEntity);
    }

    private SupportTicket getTicketOrThrow(UUID id, UUID organizationId) {
        return ticketRepository.findByIdAndOrganizationIdAndDeletedFalse(id, organizationId)
                .orElseThrow(() -> new EntityNotFoundException("Заявка не найдена: " + id));
    }

    private void validateUserTenant(UUID userId, UUID organizationId) {
        User user = userRepository.findByIdAndOrganizationIdAndDeletedFalse(userId, organizationId)
                .orElseThrow(() -> new EntityNotFoundException("Пользователь не найден: " + userId));
        if (user.getOrganizationId() == null || !organizationId.equals(user.getOrganizationId())) {
            throw new EntityNotFoundException("Пользователь не найден: " + userId);
        }
    }

    private String generateTicketCode() {
        long seq = ticketRepository.getNextNumberSequence();
        return String.format("TKT-%05d", seq);
    }
}
