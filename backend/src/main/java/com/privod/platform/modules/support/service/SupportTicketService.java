package com.privod.platform.modules.support.service;

import com.privod.platform.infrastructure.audit.AuditService;
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
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<SupportTicketResponse> listTickets(TicketStatus status, Pageable pageable) {
        if (status != null) {
            return ticketRepository.findByStatusAndDeletedFalse(status, pageable)
                    .map(SupportTicketResponse::fromEntity);
        }
        return ticketRepository.findAll(pageable).map(SupportTicketResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public SupportTicketResponse getTicket(UUID id) {
        SupportTicket ticket = getTicketOrThrow(id);
        return SupportTicketResponse.fromEntity(ticket);
    }

    @Transactional
    public SupportTicketResponse createTicket(CreateSupportTicketRequest request) {
        String code = generateTicketCode();

        SupportTicket ticket = SupportTicket.builder()
                .code(code)
                .subject(request.subject())
                .description(request.description())
                .category(request.category())
                .priority(request.priority() != null ? request.priority() : TicketPriority.MEDIUM)
                .status(TicketStatus.OPEN)
                .reporterId(request.reporterId())
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
        SupportTicket ticket = getTicketOrThrow(id);

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
        SupportTicket ticket = getTicketOrThrow(id);

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
        SupportTicket ticket = getTicketOrThrow(id);

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
        SupportTicket ticket = getTicketOrThrow(id);

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

        log.info("Support ticket resolved: {} ({})", ticket.getCode(), ticket.getId());
        return SupportTicketResponse.fromEntity(ticket);
    }

    @Transactional
    public SupportTicketResponse closeTicket(UUID id) {
        SupportTicket ticket = getTicketOrThrow(id);

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
        SupportTicket ticket = getTicketOrThrow(id);
        ticket.softDelete();
        ticketRepository.save(ticket);
        auditService.logDelete("SupportTicket", id);
        log.info("Support ticket deleted: {} ({})", ticket.getCode(), id);
    }

    // ---- Comments ----

    @Transactional(readOnly = true)
    public List<TicketCommentResponse> getTicketComments(UUID ticketId) {
        getTicketOrThrow(ticketId);
        return commentRepository.findByTicketIdAndDeletedFalseOrderByCreatedAtDesc(ticketId)
                .stream()
                .map(TicketCommentResponse::fromEntity)
                .toList();
    }

    @Transactional
    public TicketCommentResponse addComment(UUID ticketId, CreateTicketCommentRequest request) {
        getTicketOrThrow(ticketId);

        TicketComment comment = TicketComment.builder()
                .ticketId(ticketId)
                .authorId(request.authorId())
                .content(request.content())
                .isInternal(request.isInternal())
                .attachmentUrls(request.attachmentUrls())
                .build();

        comment = commentRepository.save(comment);
        auditService.logCreate("TicketComment", comment.getId());

        log.info("Comment added to ticket {}: ({})", ticketId, comment.getId());
        return TicketCommentResponse.fromEntity(comment);
    }

    // ---- Dashboard ----

    @Transactional(readOnly = true)
    public TicketDashboardResponse getDashboard() {
        long totalTickets = ticketRepository.countTotal();
        long openTickets = ticketRepository.countOpen();

        Map<String, Long> statusCounts = new HashMap<>();
        for (Object[] row : ticketRepository.countByStatus()) {
            TicketStatus status = (TicketStatus) row[0];
            Long count = (Long) row[1];
            statusCounts.put(status.name(), count);
        }

        Map<String, Long> priorityCounts = new HashMap<>();
        for (Object[] row : ticketRepository.countByPriority()) {
            TicketPriority priority = (TicketPriority) row[0];
            Long count = (Long) row[1];
            priorityCounts.put(priority.name(), count);
        }

        return new TicketDashboardResponse(totalTickets, openTickets, statusCounts, priorityCounts);
    }

    @Transactional(readOnly = true)
    public Page<SupportTicketResponse> getMyTickets(UUID reporterId, Pageable pageable) {
        return ticketRepository.findByReporterIdAndDeletedFalse(reporterId, pageable)
                .map(SupportTicketResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public Page<SupportTicketResponse> getAssignedTickets(UUID assigneeId, Pageable pageable) {
        return ticketRepository.findByAssigneeIdAndDeletedFalse(assigneeId, pageable)
                .map(SupportTicketResponse::fromEntity);
    }

    private SupportTicket getTicketOrThrow(UUID id) {
        return ticketRepository.findById(id)
                .filter(t -> !t.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Заявка не найдена: " + id));
    }

    private String generateTicketCode() {
        long seq = ticketRepository.getNextNumberSequence();
        return String.format("TKT-%05d", seq);
    }
}
