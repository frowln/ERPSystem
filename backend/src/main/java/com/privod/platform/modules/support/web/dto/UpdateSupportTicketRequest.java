package com.privod.platform.modules.support.web.dto;

import com.privod.platform.modules.support.domain.TicketPriority;
import com.privod.platform.modules.support.domain.TicketStatus;

import java.time.LocalDate;
import java.util.UUID;

public record UpdateSupportTicketRequest(
        String subject,
        String description,
        String category,
        TicketPriority priority,
        TicketStatus status,
        UUID assigneeId,
        LocalDate dueDate,
        Integer satisfactionRating
) {
}
