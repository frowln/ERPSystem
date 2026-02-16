package com.privod.platform.modules.support.web.dto;

import com.privod.platform.modules.support.domain.SupportTicket;
import com.privod.platform.modules.support.domain.TicketPriority;
import com.privod.platform.modules.support.domain.TicketStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record SupportTicketResponse(
        UUID id,
        String code,
        String subject,
        String description,
        String category,
        TicketPriority priority,
        String priorityDisplayName,
        TicketStatus status,
        String statusDisplayName,
        UUID reporterId,
        UUID assigneeId,
        LocalDate dueDate,
        Instant resolvedAt,
        Integer satisfactionRating,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static SupportTicketResponse fromEntity(SupportTicket ticket) {
        return new SupportTicketResponse(
                ticket.getId(),
                ticket.getCode(),
                ticket.getSubject(),
                ticket.getDescription(),
                ticket.getCategory(),
                ticket.getPriority(),
                ticket.getPriority().getDisplayName(),
                ticket.getStatus(),
                ticket.getStatus().getDisplayName(),
                ticket.getReporterId(),
                ticket.getAssigneeId(),
                ticket.getDueDate(),
                ticket.getResolvedAt(),
                ticket.getSatisfactionRating(),
                ticket.getCreatedAt(),
                ticket.getUpdatedAt(),
                ticket.getCreatedBy()
        );
    }
}
