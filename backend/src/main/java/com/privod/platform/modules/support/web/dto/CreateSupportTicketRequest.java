package com.privod.platform.modules.support.web.dto;

import com.privod.platform.modules.support.domain.TicketPriority;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;
import java.util.UUID;

public record CreateSupportTicketRequest(
        @NotBlank(message = "Тема заявки обязательна")
        String subject,

        @NotBlank(message = "Описание заявки обязательно")
        String description,

        String category,
        TicketPriority priority,
        UUID reporterId,
        LocalDate dueDate
) {
}
